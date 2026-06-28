#!/usr/bin/env node
/**
 * configure-email.js
 *
 * Points Supabase Auth at Resend (custom SMTP) so confirmation, magic-link,
 * and password-reset emails actually send. Without this, Supabase uses its
 * built-in dev mailer which is capped at ~2 emails/hour — the reason emails
 * "stopped arriving".
 *
 * Run AFTER you have:
 *   1. A VALID Resend API key in .env (RESEND_API_KEY=re_...)
 *   2. Verified the sending domain (edgekeeper.io) in the Resend dashboard
 *
 * Usage:
 *   node scripts/configure-email.js          # validate + apply
 *   node scripts/configure-email.js --check  # validate only, change nothing
 *
 * It validates the Resend key and domain first and refuses to apply if either
 * is broken, so it can't make the situation worse.
 */
require('dotenv').config();

const CHECK_ONLY = process.argv.includes('--check');

const SUPABASE_URL   = process.env.SUPABASE_URL;
const MGMT_TOKEN     = process.env.SUPABASE_MANAGEMENT_TOKEN;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM    = process.env.RESEND_FROM || 'EdgeKeeper <noreply@edgekeeper.io>';

class FailError extends Error {}
// Set exit code and throw instead of process.exit(): exiting mid-fetch trips a
// libuv assertion on Windows because undici keep-alive sockets are still open.
function fail(msg) { process.exitCode = 1; throw new FailError(msg); }

if (!SUPABASE_URL)   fail('SUPABASE_URL missing from .env');
if (!MGMT_TOKEN)     fail('SUPABASE_MANAGEMENT_TOKEN missing from .env');
if (!RESEND_API_KEY) fail('RESEND_API_KEY missing from .env');

const ref = SUPABASE_URL.replace('https://', '').split('.')[0];

// Parse "EdgeKeeper <noreply@edgekeeper.io>" → { name, email }
const m = RESEND_FROM.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
const senderName  = (m ? m[1] : 'EdgeKeeper') || 'EdgeKeeper';
const senderEmail = (m ? m[2] : RESEND_FROM).trim();
const senderDomain = senderEmail.split('@')[1];

(async () => {
  // 1. Validate the Resend key + sending domain
  console.log('Checking Resend key…');
  const dRes = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  });
  const dJson = await dRes.json().catch(() => ({}));
  if (!dRes.ok) {
    fail(`Resend rejected the API key (${dRes.status}: ${dJson.message || 'invalid'}).\n` +
         `  → Generate a new key at https://resend.com/api-keys, put it in .env as RESEND_API_KEY, and re-run.`);
  }
  const domains = dJson.data || dJson || [];
  const match = Array.isArray(domains) ? domains.find(d => d.name === senderDomain) : null;
  console.log(`  key OK. Sending domain: ${senderEmail}`);
  if (!match) {
    fail(`Domain "${senderDomain}" is not added in Resend.\n` +
         `  → Add + verify it at https://resend.com/domains (DNS records), then re-run.`);
  }
  if (match.status !== 'verified') {
    fail(`Domain "${senderDomain}" status is "${match.status}", not "verified".\n` +
         `  → Finish DNS verification at https://resend.com/domains, then re-run.`);
  }
  console.log(`  domain "${senderDomain}" is verified ✓`);

  if (CHECK_ONLY) {
    console.log('\n--check passed: Resend is ready. Re-run without --check to apply the Supabase SMTP config.\n');
    return;
  }

  // 2. Point Supabase Auth at Resend SMTP
  console.log('\nConfiguring Supabase custom SMTP → Resend…');
  const body = {
    smtp_host:        'smtp.resend.com',
    smtp_port:        465,
    smtp_user:        'resend',
    smtp_pass:        RESEND_API_KEY,
    smtp_admin_email: senderEmail,
    smtp_sender_name: senderName,
    rate_limit_email_sent: 100, // lift the 2/hour dev cap
  };
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${MGMT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    fail(`Supabase config update failed (${res.status}): ${t.slice(0, 300)}`);
  }
  console.log('  Supabase SMTP set to smtp.resend.com (sender ' + senderEmail + ')');
  console.log('  rate_limit_email_sent raised 2 → 100 /hour');
  console.log('\n✓ Done. Auth emails (confirm / magic-link / reset) now send via Resend.');
  console.log('  Test: trigger a password-reset from /auth.html and confirm the email arrives.\n');
})().catch(e => {
  console.error('\n✗ ' + (e instanceof FailError ? e.message : 'Unexpected error: ' + e.message) + '\n');
  process.exitCode = 1;
});
