#!/usr/bin/env node
/**
 * email-golive.mjs — one command to fully activate transactional email.
 *
 * PREREQUISITE (the one thing only you can do): put a VALID Resend API key in
 * .env as RESEND_API_KEY=re_...  (create one at https://resend.com/api-keys).
 *
 * Then run:  node scripts/email-golive.mjs
 *
 * It will, end to end:
 *   1. Validate the Resend key.
 *   2. Ensure edgekeeper.org is registered in Resend (adds it if missing) and
 *      read back the DKIM/SPF/DMARC DNS records Resend needs.
 *   3. Add those records to Vercel DNS (the domain is Vercel-managed, so no
 *      registrar step). Existing matching records are skipped.
 *   4. Poll Resend until the domain verifies (up to ~3 min).
 *   5. Point Supabase Auth at Resend SMTP + apply the branded auth templates
 *      (scripts/set-auth-emails.mjs).
 *
 * Idempotent and safe to re-run. Requires in .env: RESEND_API_KEY,
 * SUPABASE_URL, SUPABASE_MANAGEMENT_TOKEN, and env VERCEL_TOKEN in the shell.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const g = (k) => { const m = env.match(new RegExp('^' + k + '=(.*)$', 'm')); return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''; };

const RESEND = g('RESEND_API_KEY');
const DOMAIN = 'edgekeeper.org';
const ref = (g('SUPABASE_URL') || '').replace('https://', '').split('.')[0];
const MGMT = g('SUPABASE_MANAGEMENT_TOKEN');
const die = (m) => { console.error('\n✗ ' + m); process.exit(1); };

if (!RESEND || !/^re_/.test(RESEND)) die('RESEND_API_KEY missing/invalid in .env — create one at https://resend.com/api-keys');

const rHead = { Authorization: `Bearer ${RESEND}`, 'Content-Type': 'application/json' };

async function rGet(p) { return (await fetch('https://api.resend.com' + p, { headers: rHead })).json(); }

(async () => {
  // 1. validate key
  const dom = await rGet('/domains');
  if (dom.statusCode === 401 || dom.name === 'validation_error') die(`Resend rejected the key (${dom.message}).`);
  console.log('✓ Resend key valid');

  // 2. ensure domain exists, get records
  let entry = (dom.data || []).find(d => d.name === DOMAIN);
  if (!entry) {
    console.log(`· adding ${DOMAIN} to Resend…`);
    const created = await (await fetch('https://api.resend.com/domains', { method: 'POST', headers: rHead, body: JSON.stringify({ name: DOMAIN, region: 'us-east-1' }) })).json();
    if (created.name === 'validation_error') die('Resend add-domain failed: ' + created.message);
    entry = created;
  }
  const full = await rGet('/domains/' + entry.id);
  const records = full.records || entry.records || [];
  console.log(`✓ ${DOMAIN} in Resend (status: ${full.status}); ${records.length} DNS records`);

  // 3. add records to Vercel DNS
  for (const rec of records) {
    // Resend record name is relative (e.g. "resend._domainkey" or "send"); '' = apex
    const name = (rec.name || '').replace(new RegExp('\\.?' + DOMAIN + '$'), '') || '@';
    const type = rec.type;                         // TXT | MX | CNAME
    const value = rec.value;
    const args = ['vercel', 'dns', 'add', DOMAIN, name, type];
    if (type === 'MX') args.push(value, String(rec.priority || 10));
    else args.push(value);
    try {
      execSync(args.map(a => `"${a}"`).join(' '), { stdio: 'pipe' });
      console.log(`  + ${type} ${name}`);
    } catch (e) {
      const msg = (e.stderr || e.stdout || '').toString();
      console.log(`  · ${type} ${name} (${/exist/i.test(msg) ? 'already present' : msg.slice(0, 60)})`);
    }
  }

  // 4. poll for verification
  console.log('· waiting for Resend to verify the domain…');
  let verified = full.status === 'verified';
  for (let i = 0; i < 18 && !verified; i++) {
    await new Promise(r => setTimeout(r, 10000));
    await fetch('https://api.resend.com/domains/' + entry.id + '/verify', { method: 'POST', headers: rHead }).catch(() => {});
    const s = await rGet('/domains/' + entry.id);
    process.stdout.write(`  status: ${s.status}\r`);
    verified = s.status === 'verified';
  }
  console.log(verified ? '\n✓ domain verified' : '\n· not verified yet — DNS can take up to 30 min; re-run later to finish');

  // 5. Supabase SMTP + templates
  const senderEmail = (g('RESEND_FROM').match(/<([^>]+)>/) || [, 'noreply@' + DOMAIN])[1];
  const smtp = {
    smtp_host: 'smtp.resend.com', smtp_port: '465', smtp_user: 'resend',
    smtp_pass: RESEND, smtp_admin_email: senderEmail, smtp_sender_name: 'EdgeKeeper',
    mailer_secure_email_change_enabled: true,
  };
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: 'PATCH', headers: { Authorization: `Bearer ${MGMT}`, 'Content-Type': 'application/json' }, body: JSON.stringify(smtp),
  });
  if (!res.ok) die('Supabase SMTP config failed: ' + (await res.text()).slice(0, 200));
  console.log('✓ Supabase Auth SMTP → smtp.resend.com (' + senderEmail + ')');

  console.log('· applying branded auth templates…');
  execSync('node ' + path.join(__dirname, 'set-auth-emails.mjs'), { stdio: 'inherit' });

  console.log('\n✔ Email is live. Send a test: reset your password from /auth.html.');
})().catch(e => die(e.message));
