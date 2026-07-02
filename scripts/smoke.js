'use strict';
// Browser smoke test: every route loads with zero JS errors and zero failed
// asset requests, guest and authed, at mobile width. Creates a throwaway pro
// user via the Supabase admin API and deletes it afterwards.
//
// Requirements:
//   - server running on PORT (default 3000): `node server.js`
//   - .env with SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
//   - Chrome: set EK_CHROME to a chrome.exe path, or run
//     `npx @puppeteer/browsers install chrome@stable` (picked up from ./chrome)
//   - `npm i puppeteer-core --no-save`
//
// Run: npm run smoke
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');

const BASE = process.env.EK_BASE_URL || 'http://localhost:3000';
const SB   = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY;

function findChrome() {
  if (process.env.EK_CHROME) return process.env.EK_CHROME;
  const root = path.join(__dirname, '..', 'chrome');
  if (fs.existsSync(root)) {
    for (const d of fs.readdirSync(root)) {
      const p = path.join(root, d, 'chrome-win64', 'chrome.exe');
      if (fs.existsSync(p)) return p;
    }
  }
  throw new Error('Chrome not found. Set EK_CHROME or run: npx @puppeteer/browsers install chrome@stable');
}

const GUEST_ROUTES = [
  '/edgekeeper.html', '/pricing.html', '/method.html', '/mike.html', '/theo.html',
  '/ashley.html', '/paths.html', '/academy-public.html', '/integrations.html',
  '/privacy.html', '/terms.html', '/auth.html',
];
const AUTHED_ROUTES = [
  '/workspace.html', '/my-academy', '/study.html', '/chamber', '/profile.html',
  '/settings.html', '/reports.html', '/reviews.html', '/network.html',
];
// Guest probes that legitimately 401/403 — not failures.
const EXPECTED_4XX = [/\/api\/auth\/me$/, /\/api\/profile$/, /\/api\/usage$/];

async function sbAdmin(pathname, opts = {}) {
  return fetch(SB + pathname, {
    ...opts,
    headers: { apikey: SVC, Authorization: `Bearer ${SVC}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
}

async function createProUser() {
  const email = `smoke${Date.now()}@gmail.com`;
  const password = 'SmokeTest!2026xyz';
  const r = await sbAdmin('/auth/v1/admin/users', {
    method: 'POST', body: JSON.stringify({ email, password, email_confirm: true }),
  });
  const u = await r.json();
  if (!u.id) throw new Error('user create failed: ' + JSON.stringify(u).slice(0, 200));
  await sbAdmin('/rest/v1/user_profiles', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ id: u.id, onboarding_complete: true, assessment_complete: true, subscription_status: 'professional', bypass_subscription: true }),
  });
  const tr = await fetch(SB + '/auth/v1/token?grant_type=password', {
    method: 'POST', headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const t = await tr.json();
  const s = await fetch(BASE + '/api/auth/session', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: t.access_token, refresh_token: t.refresh_token }),
  });
  const m = (s.headers.get('set-cookie') || '').match(/ek_session=([^;]+)/);
  if (!m) throw new Error('no session cookie');
  return { id: u.id, cookie: m[1] };
}

(async () => {
  const puppeteer = require('puppeteer-core');
  const chromePath = findChrome();
  const user = await createProUser();
  const b = await puppeteer.launch({
    executablePath: chromePath, headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });
  let failures = 0;

  async function sweep(label, routes, cookie) {
    const p = await b.newPage();
    await p.setViewport({ width: 375, height: 812, isMobile: true });
    if (cookie) await p.setCookie({ name: 'ek_session', value: cookie, domain: new URL(BASE).hostname, path: '/' });
    let errs = [], bad = [];
    p.on('pageerror', e => errs.push(e.message.split('\n')[0].slice(0, 70)));
    p.on('response', r => {
      if (r.status() >= 400 && !r.url().includes('favicon') && !EXPECTED_4XX.some(re => re.test(r.url()))) {
        bad.push(`${r.status()} ${r.url().replace(BASE, '').slice(0, 55)}`);
      }
    });
    for (const route of routes) {
      errs = []; bad = [];
      let status = '?';
      try {
        const resp = await p.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 15000 });
        status = resp ? resp.status() : '?';
      } catch (_) { status = 'TIMEOUT'; }
      await new Promise(r => setTimeout(r, 1500));
      const failed = errs.length > 0 || bad.length > 0 || status === 'TIMEOUT' || status >= 400;
      if (failed) failures++;
      console.log(`${failed ? 'FAIL' : ' ok '} [${label}] ${String(status).padEnd(4)} ${route.padEnd(24)} ${errs[0] || ''} ${bad[0] || ''}`);
    }
    await p.close();
  }

  try {
    await sweep('guest', GUEST_ROUTES, null);
    await sweep('pro', AUTHED_ROUTES, user.cookie);
  } finally {
    await b.close();
    await sbAdmin('/auth/v1/admin/users/' + user.id, { method: 'DELETE' });
  }

  if (failures) { console.error(`\n${failures} route(s) failed`); process.exit(1); }
  console.log('\nSmoke test passed: all routes clean.');
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
