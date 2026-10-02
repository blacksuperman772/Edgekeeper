// Diagnostic: dump a user's live Guardian state. Usage: node scripts/diag-guardian.mjs <email>
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const g = (k) => { const m = env.match(new RegExp('^' + k + '=(.*)$', 'm')); return m ? m[1].trim().replace(/^["']|["']$/g, '') : ''; };
process.env.METAAPI_TOKEN = g('METAAPI_TOKEN');

const sb = createClient(g('SUPABASE_URL'), g('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
const email = (process.argv[2] || 'alexandermwhitmore@gmail.com').toLowerCase();

let userId = null;
for (let p = 1; p <= 20 && !userId; p++) {
  const { data } = await sb.auth.admin.listUsers({ page: p, perPage: 200 });
  const hit = (data?.users || []).find(u => (u.email || '').toLowerCase() === email);
  if (hit) userId = hit.id;
  if (!data?.users?.length || data.users.length < 200) break;
}
console.log('user:', email, userId);

const { data: bc } = await sb.from('broker_connections').select('*').eq('user_id', userId).maybeSingle();
console.log('\n--- broker_connections ---');
console.log(bc ? { metaapi_account_id: bc.metaapi_account_id, status: bc.status, status_detail: bc.status_detail, platform: bc.platform, server: bc.server, region: bc.region, last_sync_at: bc.last_sync_at } : 'NONE');

const { data: gd } = await sb.from('guardian_data').select('*').eq('user_id', userId).maybeSingle();
console.log('\n--- guardian_data ---');
console.log(gd ? { is_connected: gd.is_connected, balance: gd.balance, equity: gd.equity, open_lots: gd.open_lots, platform: gd.platform, last_updated: gd.last_updated } : 'NONE');

if (bc?.metaapi_account_id) {
  const metaapi = (await import('../lib/metaapi.js')).default || (await import('../lib/metaapi.js'));
  console.log('\n--- MetaApi live getAccount ---');
  try {
    const acct = await metaapi.getAccount(bc.metaapi_account_id);
    console.log({ state: acct?.state, connectionStatus: acct?.connectionStatus, region: acct?.region, name: acct?.name, login: acct?.login });
    if ((acct?.connectionStatus || acct?.state) === 'CONNECTED') {
      try {
        const info = await metaapi.getAccountInformation(bc.metaapi_account_id, acct?.region || bc.region);
        console.log('accountInformation:', { balance: info?.balance, equity: info?.equity, currency: info?.currency });
      } catch (e) { console.log('getAccountInformation FAILED:', e.status, e.message); }
    }
  } catch (e) {
    console.log('getAccount FAILED:', e.status, e.message);
  }
}
