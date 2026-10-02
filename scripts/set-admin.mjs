#!/usr/bin/env node
/**
 * set-admin.mjs — grant (or with --revoke, remove) is_admin on a user_profiles row.
 *
 *   node scripts/set-admin.mjs <email>            # grant admin
 *   node scripts/set-admin.mjs <email> --revoke   # remove admin
 *
 * Looks the user up in Supabase Auth by email, then flips user_profiles.is_admin.
 * Uses the service-role key from .env (server-side only). Idempotent.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const g = (k) => { const m = env.match(new RegExp('^' + k + '=(.*)$', 'm')); return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''; };

const email = (process.argv[2] || '').trim().toLowerCase();
const revoke = process.argv.includes('--revoke');
if (!email) { console.error('Usage: node scripts/set-admin.mjs <email> [--revoke]'); process.exit(1); }

const supabase = createClient(g('SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Find the auth user by email (paginate — no direct getUserByEmail).
let userId = null;
for (let page = 1; page <= 20 && !userId; page++) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
  if (error) { console.error('listUsers failed:', error.message); process.exit(1); }
  const hit = (data?.users || []).find(u => (u.email || '').toLowerCase() === email);
  if (hit) userId = hit.id;
  if (!data?.users?.length || data.users.length < 200) break;
}
if (!userId) { console.error(`No auth user found for ${email}`); process.exit(1); }

const { error: upErr } = await supabase
  .from('user_profiles')
  .update({ is_admin: !revoke })
  .eq('id', userId);
if (upErr) { console.error('update failed:', upErr.message); process.exit(1); }

// Read back to confirm.
const { data: prof } = await supabase
  .from('user_profiles')
  .select('id, is_admin')
  .eq('id', userId)
  .maybeSingle();
console.log(`${email} (${userId}) → is_admin = ${prof?.is_admin}`);
