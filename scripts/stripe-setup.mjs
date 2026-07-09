#!/usr/bin/env node
/**
 * stripe-setup.mjs — create (idempotently) the EdgeKeeper subscription products
 * and prices in Stripe, then print the price IDs to paste into env.
 *
 * Prices mirror pricing.html:
 *   Resident (starter):      $99/mo    $990/yr
 *   Fellow (pro):            $249/mo   $2490/yr
 *   Private Office (pro'l):  $599/mo   $5990/yr
 *
 * Idempotent via price lookup_keys (ek_<plan>_<interval>): re-running reuses
 * existing prices instead of creating duplicates.
 *
 * Run:  node scripts/stripe-setup.mjs
 * Requires STRIPE_SECRET_KEY in .env.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const g = (k) => { const m = env.match(new RegExp('^' + k + '=(.*)$', 'm')); return m ? m[1].trim() : ''; };

const KEY = g('STRIPE_SECRET_KEY');
if (!/^sk_(live|test)_/.test(KEY)) { console.error('✗ STRIPE_SECRET_KEY missing/invalid in .env'); process.exit(1); }
const stripe = new Stripe(KEY);
const LIVE = KEY.startsWith('sk_live_');

const PLANS = [
  { key: 'starter',      name: 'EdgeKeeper — Resident',       monthly: 9900,  annual: 99000 },
  { key: 'pro',          name: 'EdgeKeeper — Fellow',         monthly: 24900, annual: 249000 },
  { key: 'professional', name: 'EdgeKeeper — Private Office', monthly: 59900, annual: 599000 },
];
const INTERVALS = [
  { billing: 'monthly', interval: 'month', field: 'monthly' },
  { billing: 'annual',  interval: 'year',  field: 'annual' },
];

async function ensureProduct(plan) {
  // Find an existing product tagged with our metadata; else create it.
  const existing = await stripe.products.search({ query: `metadata['ek_plan']:'${plan.key}' AND active:'true'` }).catch(() => ({ data: [] }));
  if (existing.data && existing.data.length) return existing.data[0];
  return stripe.products.create({
    name: plan.name,
    metadata: { ek_plan: plan.key },
  });
}

async function ensurePrice(plan, product, iv) {
  const lookup = `ek_${plan.key}_${iv.billing}`;
  const found = await stripe.prices.list({ lookup_keys: [lookup], active: true, limit: 1 });
  if (found.data && found.data.length) return found.data[0];
  return stripe.prices.create({
    product: product.id,
    unit_amount: plan[iv.field],
    currency: 'usd',
    recurring: { interval: iv.interval },
    lookup_key: lookup,
    metadata: { ek_plan: plan.key, ek_billing: iv.billing },
  });
}

(async () => {
  console.log(`· Stripe ${LIVE ? 'LIVE' : 'TEST'} mode\n`);
  const envLines = [];
  for (const plan of PLANS) {
    const product = await ensureProduct(plan);
    for (const iv of INTERVALS) {
      const price = await ensurePrice(plan, product, iv);
      const envKey = `STRIPE_PRICE_${plan.key.toUpperCase()}_${iv.billing.toUpperCase()}`;
      envLines.push(`${envKey}=${price.id}`);
      console.log(`  ✓ ${plan.key.padEnd(13)} ${iv.billing.padEnd(7)} ${(price.unit_amount / 100).toString().padStart(5)} USD  ${price.id}`);
    }
  }
  console.log('\n── paste these into .env and Vercel env ──');
  console.log(envLines.join('\n'));
  // Also write to a file the caller can source.
  fs.writeFileSync(path.join(__dirname, '..', '.stripe-prices.env'), envLines.join('\n') + '\n');
  console.log('\n(also written to .stripe-prices.env)');
})().catch(e => { console.error('✗', e.message); process.exit(1); });
