#!/usr/bin/env node
/**
 * email-preview.mjs — renders every EdgeKeeper email (transactional + auth) with
 * sample data and sends each to the admin inbox so branding/layout can be checked.
 *
 * Templates are copied from server.js (transactional) and scripts/set-auth-emails.mjs
 * (auth) so this is a zero-risk, standalone preview — it touches no production code.
 *
 * Run: node scripts/email-preview.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const g = (k) => { const m = env.match(new RegExp('^' + k + '=(.*)$', 'm')); return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''; };
const KEY  = g('RESEND_API_KEY');
const FROM = g('RESEND_FROM') || 'EdgeKeeper <noreply@edgekeeper.org>';
const TO   = g('ALERT_EMAIL') || g('CONTACT_EMAIL');
const APP_URL = g('APP_URL') || 'https://edgekeeper.org';
const SITE = 'https://edgekeeper.org';
if (!KEY) { console.error('RESEND_API_KEY missing'); process.exit(1); }
if (!TO)  { console.error('No ALERT_EMAIL/CONTACT_EMAIL to send previews to'); process.exit(1); }

/* ── Transactional shell (from server.js) ── */
const _emailShell = (accentColor, body) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"></head>
<body style="margin:0;padding:0;background:#050505;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#050505" style="background:#050505;"><tr><td align="center" style="padding:40px 16px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
    <tr><td style="padding:0 8px 26px;text-align:center;"><span style="font-family:Georgia,serif;font-size:18px;letter-spacing:0.28em;color:#8a8a82;">EDGE<span style="color:${accentColor};">K</span>EEPER</span></td></tr>
    <tr><td bgcolor="#0f0f0f" style="background:#0f0f0f;border:1px solid #1e1e1e;border-radius:8px;padding:42px 38px;">${body}</td></tr>
    <tr><td style="padding:26px 8px 0;text-align:center;"><p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.7;color:#55554f;">EdgeKeeper — a trader development institution.<br>Behavioral coaching only. This is not financial advice.<br><a href="${APP_URL}/settings.html" style="color:#6a6a62;text-decoration:none;">Manage notifications</a> &middot; <a href="${APP_URL}" style="color:#6a6a62;text-decoration:none;">edgekeeper.org</a></p></td></tr>
  </table>
</td></tr></table></body></html>`;
const _eyebrow  = (t, c) => `<p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:bold;letter-spacing:0.2em;text-transform:uppercase;color:${c};">${t}</p>`;
const _headline = (t) => `<h1 style="margin:0 0 18px;font-family:Georgia,serif;font-weight:normal;font-size:25px;line-height:1.3;color:#ece6db;">${t}</h1>`;
const _p = (t) => `<p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.75;color:#d4d0c8;">${t}</p>`;
const _cta = (t, u, c) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px 0 4px;"><tr><td align="center" bgcolor="${c}" style="border-radius:4px;"><a href="${u}" target="_blank" style="display:inline-block;padding:14px 32px;font-family:Helvetica,Arial,sans-serif;font-size:12px;font-weight:bold;letter-spacing:0.09em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;border-radius:4px;">${t}</a></td></tr></table>`;
const gold = '#b8a06a', green = '#6b8c6b', amber = '#c08a3e';

const transactional = [
  ['Welcome (Marcus)', 'Your seat is ready.', _emailShell(gold, _eyebrow('Marcus · EdgeKeeper', gold) + _headline('Your seat is ready.') + _p('Your intake is saved, and Marcus has already started building your profile.') + _p('The conversation picks up exactly where you left off — no re-introduction needed.') + _cta('Enter the workspace', APP_URL + '/workspace.html', gold))],
  ['Mentor check-in (Iris)', 'Iris wants to check in', _emailShell(green, _eyebrow('Iris · Checking in', green) + `<p style="margin:0 0 16px;font-family:Georgia,serif;font-size:17px;line-height:1.9;color:#ece6db;">Three weeks quiet, then a loss you didn't log. That's usually the tell. Come talk before the next trade, not after it.</p>` + _cta('Resume your session', APP_URL + '/workspace.html', green))],
  ['Plan confirmed (billing)', "You're on the Fellow plan.", _emailShell(gold, _eyebrow('Marcus · Plan confirmed', gold) + _headline('Your Fellow plan is active.') + _p("Everything you've unlocked is ready in the workspace. Marcus will pick up from where you left off.") + _cta('Open your workspace', APP_URL + '/workspace.html', gold))],
  ['Monthly report ready', 'Your June 2026 report is ready.', _emailShell(gold, _eyebrow('Marcus · Monthly report', gold) + _headline('Your June 2026 report is ready.') + _p('Marcus has gone through your journal entries, rule violations, and discipline scores for the month.') + _cta('Read your report', APP_URL + '/reports.html', gold))],
  ['Payment failed (dunning)', 'Payment issue on your EdgeKeeper plan', _emailShell(amber, _eyebrow('EdgeKeeper · Payment issue', amber) + _headline('We couldn’t process your Fellow payment.') + _p('Your card was declined on the latest renewal. Your access stays on for now, but it will pause if the payment isn’t updated.') + _p('Update your payment method and we’ll retry automatically — there’s nothing else to do.') + _cta('Update payment method', APP_URL + '/settings.html', amber))],
  ['Cancellation confirmed', 'Your Fellow plan is set to end', _emailShell(gold, _eyebrow('EdgeKeeper · Membership', gold) + _headline('Your Fellow plan is set to end.') + _p('Your cancellation is confirmed. You keep full access until the end of your current billing period — nothing changes before then.') + _p('If you change your mind, you can resume any time and pick up exactly where you left off.') + _cta('Manage membership', APP_URL + '/settings.html', gold))],
];

/* ── Auth shell (from set-auth-emails.mjs) ── */
const C = { gold: '#b8a06a', bg: '#050505', card: '#0f0f0f', border: '#1e1e1e', text: '#d4d0c8', bright: '#ece6db', muted: '#7a7a72' };
function shell({ preheader, headline, intro, body = [], ctaText, ctaUrl, tokenBlock, footnote }) {
  const button = ctaText && ctaUrl ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:30px 0 6px;"><tr><td align="center" bgcolor="${C.gold}" style="border-radius:4px;"><a href="${ctaUrl}" target="_blank" style="display:inline-block;padding:15px 36px;font-family:Helvetica,Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:0.09em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;border-radius:4px;">${ctaText}</a></td></tr></table>` : '';
  const tok = tokenBlock ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px;"><tr><td align="center" style="border:1px solid ${C.border};border-radius:4px;padding:16px 30px;background:#141414;font-family:'Courier New',monospace;font-size:28px;letter-spacing:0.3em;color:${C.gold};">${tokenBlock}</td></tr></table>` : '';
  const paras = body.map(l => `<p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:${C.text};">${l}</p>`).join('');
  const url = ctaUrl ? `<p style="margin:22px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6;color:${C.muted};">Or paste this link into your browser:<br><a href="${ctaUrl}" target="_blank" style="color:${C.gold};word-break:break-all;">${ctaUrl}</a></p>` : '';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"></head>
<body style="margin:0;padding:0;background:${C.bg};"><span style="display:none!important;max-height:0;overflow:hidden;opacity:0;color:${C.bg};">${preheader || ''}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${C.bg}" style="background:${C.bg};"><tr><td align="center" style="padding:40px 16px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
    <tr><td style="padding:0 8px 26px;text-align:center;"><span style="font-family:Georgia,serif;font-size:18px;letter-spacing:0.28em;color:#8a8a82;">EDGE<span style="color:${C.gold};">K</span>EEPER</span></td></tr>
    <tr><td bgcolor="${C.card}" style="background:${C.card};border:1px solid ${C.border};border-radius:8px;padding:42px 38px;">
      <h1 style="margin:0 0 18px;font-family:Georgia,serif;font-weight:normal;font-size:26px;line-height:1.25;color:${C.bright};">${headline}</h1>
      ${intro ? `<p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:${C.text};">${intro}</p>` : ''}
      ${paras}${button}${tok}${url}
      ${footnote ? `<p style="margin:26px 0 0;padding-top:20px;border-top:1px solid ${C.border};font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:${C.muted};">${footnote}</p>` : ''}
    </td></tr>
    <tr><td style="padding:26px 8px 0;text-align:center;"><p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:11px;line-height:1.7;color:#55554f;">EdgeKeeper — a trader development institution.<br>Behavioral coaching only. This is not financial advice.<br><a href="${SITE}" style="color:#6a6a62;text-decoration:none;">edgekeeper.org</a></p></td></tr>
  </table></td></tr></table></body></html>`;
}
const LINK = APP_URL + '/auth.html?token=sample-preview-token-1234567890';
const auth = [
  ['Confirm signup', 'Confirm your email to enter EdgeKeeper', shell({ preheader: 'Confirm your email to enter EdgeKeeper.', headline: 'One step from the room.', intro: 'Confirm this email address and your EdgeKeeper account is ready. Your mentor is waiting.', ctaText: 'Confirm email', ctaUrl: LINK, footnote: "If you didn't create an EdgeKeeper account, you can safely ignore this email." })],
  ['Password reset', 'Reset your EdgeKeeper password', shell({ preheader: 'Reset your EdgeKeeper password.', headline: 'Reset your password.', intro: 'Someone asked to reset the password for this account. If that was you, choose a new one below.', ctaText: 'Reset password', ctaUrl: LINK, footnote: "This link expires in one hour. If you didn't request it, ignore this email — your password stays the same." })],
  ['Magic link login', 'Your EdgeKeeper sign-in link', shell({ preheader: 'Your EdgeKeeper sign-in link.', headline: 'Your way back in.', intro: 'Use the link below to sign in. No password needed.', ctaText: 'Sign in to EdgeKeeper', ctaUrl: LINK, footnote: "This link expires in one hour and works once. If you didn't request it, ignore this email." })],
  ['Email change', 'Confirm your new email address', shell({ preheader: 'Confirm your new email address.', headline: 'Confirm your new email.', intro: 'Confirm you@newaddress.com as the new email for your EdgeKeeper account.', ctaText: 'Confirm new email', ctaUrl: LINK, footnote: "If you didn't request this change, contact us at support@edgekeeper.org right away." })],
  ['Invitation', "You've been invited to EdgeKeeper", shell({ preheader: "You've been invited to EdgeKeeper.", headline: "You've been invited.", intro: "You've been invited to EdgeKeeper — a place traders come to become someone they can trust under pressure. Accept below to set up your account.", ctaText: 'Accept invitation', ctaUrl: LINK })],
  ['Verification code (2FA)', 'Your verification code', shell({ preheader: 'Your verification code.', headline: "Verify it's you.", intro: 'Enter this code to continue. It expires shortly.', tokenBlock: '482913', footnote: "If you didn't request this, someone may have your password — reset it and contact support@edgekeeper.org." })],
  ['Password changed (security)', 'Your EdgeKeeper password was changed', shell({ preheader: 'Your EdgeKeeper password was changed.', headline: 'Your password was changed.', intro: 'This confirms the password for your EdgeKeeper account (you@email.com) was just changed.', footnote: "Didn't do this? Reset your password immediately from the sign-in page and contact support@edgekeeper.org." })],
  ['Email changed (security)', 'Your EdgeKeeper email was changed', shell({ preheader: 'Your EdgeKeeper email was changed.', headline: 'Your email was changed.', intro: 'The email address on your EdgeKeeper account was changed to you@newaddress.com.', footnote: "Didn't do this? Contact support@edgekeeper.org right away so we can secure your account." })],
];

const all = [...transactional.map(([n, s, h]) => ['TRANSACTIONAL', n, s, h]), ...auth.map(([n, s, h]) => ['AUTH', n, s, h])];
let i = 0;
for (const [group, name, subj, html] of all) {
  i++;
  const subject = `[EK EMAIL ${i}/${all.length} · ${group}] ${name} — “${subj}”`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: TO, subject, html }),
  });
  console.log((r.ok ? '✓' : '✗') + ' ' + subject + (r.ok ? '' : '  — ' + (await r.text()).slice(0, 120)));
  await new Promise(res => setTimeout(res, 600)); // gentle pacing under Resend's rate limit
}
console.log(`\nSent ${all.length} preview emails to ${TO}.`);
