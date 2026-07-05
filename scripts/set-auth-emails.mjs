#!/usr/bin/env node
/**
 * set-auth-emails.mjs
 *
 * Installs branded EdgeKeeper templates + subjects for every Supabase Auth email
 * (confirmation, recovery, magic link, email change, invite, reauthentication,
 * and the password/email-changed security notifications), points site_url +
 * uri_allow_list at the live edgekeeper.org domain, and enables the security
 * notification emails.
 *
 * Independent of the SMTP provider — templates render whenever an auth mail is
 * sent, whether via Supabase's dev mailer or Resend. Idempotent; re-run any time
 * the copy or brand changes.
 *
 *   node scripts/set-auth-emails.mjs           # apply
 *   node scripts/set-auth-emails.mjs --check   # print the payload, change nothing
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const g = (k) => { const m = env.match(new RegExp('^' + k + '=(.*)$', 'm')); return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''; };
const CHECK = process.argv.includes('--check');

const SUPABASE_URL = g('SUPABASE_URL');
const MGMT = g('SUPABASE_MANAGEMENT_TOKEN');
const SITE = 'https://edgekeeper.org';
if (!SUPABASE_URL || !MGMT) { console.error('SUPABASE_URL / SUPABASE_MANAGEMENT_TOKEN missing from .env'); process.exit(1); }
const ref = SUPABASE_URL.replace('https://', '').split('.')[0];

// ── Branded email shell (table layout, inline styles, system fonts — email-safe) ──
const C = { gold: '#b8a06a', bg: '#050505', card: '#0f0f0f', border: '#1e1e1e', text: '#d4d0c8', bright: '#ece6db', muted: '#7a7a72' };

function shell({ preheader, headline, intro, body = [], ctaText, ctaUrl, tokenBlock, footnote }) {
  const button = ctaText && ctaUrl ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px 0 6px;"><tr>
        <td align="center" bgcolor="${C.gold}" style="border-radius:4px;">
          <a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:15px 36px;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:0.09em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;border-radius:4px;">${ctaText}</a>
        </td></tr></table>` : '';
  const tok = tokenBlock ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px;"><tr>
        <td align="center" style="border:1px solid ${C.border};border-radius:4px;padding:16px 30px;background:#141414;font-family:'Courier New',monospace;font-size:28px;letter-spacing:0.3em;color:${C.gold};">${tokenBlock}</td>
      </tr></table>` : '';
  const paras = body.map(l => `<p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:${C.text};">${l}</p>`).join('');
  const url = ctaUrl ? `<p style="margin:22px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6;color:${C.muted};">Or paste this link into your browser:<br><a href="${ctaUrl}" target="_blank" style="color:${C.gold};word-break:break-all;">${ctaUrl}</a></p>` : '';
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"></head>
<body style="margin:0;padding:0;background:${C.bg};">
<span style="display:none!important;max-height:0;overflow:hidden;opacity:0;color:${C.bg};">${preheader || ''}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.bg}" style="background:${C.bg};"><tr><td align="center" style="padding:40px 16px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
    <tr><td style="padding:0 8px 26px;text-align:center;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:18px;letter-spacing:0.28em;color:#8a8a82;">EDGE<span style="color:${C.gold};">K</span>EEPER</span>
    </td></tr>
    <tr><td bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.border};border-radius:8px;padding:42px 38px;">
      <h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-weight:normal;font-size:26px;line-height:1.25;color:${C.bright};">${headline}</h1>
      ${intro ? `<p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:${C.text};">${intro}</p>` : ''}
      ${paras}${button}${tok}${url}
      ${footnote ? `<p style="margin:26px 0 0;padding-top:20px;border-top:1px solid ${C.border};font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${C.muted};">${footnote}</p>` : ''}
    </td></tr>
    <tr><td style="padding:26px 8px 0;text-align:center;">
      <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.7;color:#55554f;">EdgeKeeper — a trader development institution.<br>Behavioral coaching only. This is not financial advice.<br><a href="${SITE}" style="color:#6a6a62;text-decoration:none;">edgekeeper.org</a></p>
    </td></tr>
  </table>
</td></tr></table></body></html>`;
}

const CONFIRM = '{{ .ConfirmationURL }}';
const templates = {
  confirmation: shell({ preheader: 'Confirm your email to enter EdgeKeeper.', headline: 'One step from the room.',
    intro: 'Confirm this email address and your EdgeKeeper account is ready. Your mentor is waiting.',
    ctaText: 'Confirm email', ctaUrl: CONFIRM, footnote: "If you didn't create an EdgeKeeper account, you can safely ignore this email." }),
  recovery: shell({ preheader: 'Reset your EdgeKeeper password.', headline: 'Reset your password.',
    intro: 'Someone asked to reset the password for this account. If that was you, choose a new one below.',
    ctaText: 'Reset password', ctaUrl: CONFIRM, footnote: "This link expires in one hour. If you didn't request it, ignore this email — your password stays the same." }),
  magic_link: shell({ preheader: 'Your EdgeKeeper sign-in link.', headline: 'Your way back in.',
    intro: 'Use the link below to sign in. No password needed.',
    ctaText: 'Sign in to EdgeKeeper', ctaUrl: CONFIRM, footnote: "This link expires in one hour and works once. If you didn't request it, ignore this email." }),
  email_change: shell({ preheader: 'Confirm your new email address.', headline: 'Confirm your new email.',
    intro: 'Confirm {{ .NewEmail }} as the new email for your EdgeKeeper account.',
    ctaText: 'Confirm new email', ctaUrl: CONFIRM, footnote: "If you didn't request this change, contact us at hello@edgekeeper.org right away." }),
  invite: shell({ preheader: "You've been invited to EdgeKeeper.", headline: "You've been invited.",
    intro: "You've been invited to EdgeKeeper — a place traders come to become someone they can trust under pressure. Accept below to set up your account.",
    ctaText: 'Accept invitation', ctaUrl: CONFIRM }),
  reauthentication: shell({ preheader: 'Your verification code.', headline: "Verify it's you.",
    intro: 'Enter this code to continue. It expires shortly.', tokenBlock: '{{ .Token }}',
    footnote: "If you didn't request this, someone may have your password — reset it and contact hello@edgekeeper.org." }),
  password_changed_notification: shell({ preheader: 'Your EdgeKeeper password was changed.', headline: 'Your password was changed.',
    intro: 'This confirms the password for your EdgeKeeper account ({{ .Email }}) was just changed.',
    footnote: "Didn't do this? Reset your password immediately from the sign-in page and contact hello@edgekeeper.org." }),
  email_changed_notification: shell({ preheader: 'Your EdgeKeeper email was changed.', headline: 'Your email was changed.',
    intro: 'The email address on your EdgeKeeper account was changed to {{ .NewEmail }}.',
    footnote: "Didn't do this? Contact hello@edgekeeper.org right away so we can secure your account." }),
};

const subjects = {
  confirmation: 'Confirm your email to enter EdgeKeeper',
  recovery: 'Reset your EdgeKeeper password',
  magic_link: 'Your EdgeKeeper sign-in link',
  email_change: 'Confirm your new email address',
  invite: "You've been invited to EdgeKeeper",
  password_changed_notification: 'Your EdgeKeeper password was changed',
  email_changed_notification: 'Your EdgeKeeper email was changed',
};

const payload = {
  site_url: SITE,
  uri_allow_list: `${SITE}/**,https://www.edgekeeper.org/**,https://edge-keeper.vercel.app/**,http://localhost:3000/**`,
  // enable the security notifications (were off)
  mailer_notifications_password_changed_enabled: true,
  mailer_notifications_email_changed_enabled: true,
};
for (const [k, v] of Object.entries(templates)) payload[`mailer_templates_${k}_content`] = v;
for (const [k, v] of Object.entries(subjects))  payload[`mailer_subjects_${k}`] = v;

if (CHECK) { console.log('Would PATCH', Object.keys(payload).length, 'fields:\n', Object.keys(payload).join('\n ')); process.exit(0); }

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
  method: 'PATCH',
  headers: { Authorization: `Bearer ${MGMT}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
const body = await res.text();
if (!res.ok) { console.error('FAILED', res.status, body.slice(0, 400)); process.exit(1); }
console.log(`Applied ${Object.keys(templates).length} branded templates + ${Object.keys(subjects).length} subjects.`);
console.log(`site_url → ${SITE}; security notifications enabled.`);
