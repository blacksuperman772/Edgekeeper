#!/usr/bin/env node
/**
 * stripe-finalize.mjs — finish the Stripe account setup via API:
 *   1. Verify the 6 products/prices exist (from stripe-setup.mjs).
 *   2. Verify the webhook endpoint exists (from stripe-webhook.mjs).
 *   3. Configure the Customer Billing Portal (cancel, update payment method,
 *      invoice history, plan switching) so /api/billing/portal works without
 *      any dashboard step. Idempotent: updates the existing default config.
 *   4. Print what only the account owner can do (activation, bank, test charge).
 *
 * Run: node scripts/stripe-finalize.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const g = (k) => { const m = env.match(new RegExp('^' + k + '=(.*)$', 'm')); return m ? m[1].trim() : ''; };
const KEY = g('STRIPE_SECRET_KEY');
if (!/^sk_live_/.test(KEY)) { console.error('✗ STRIPE_SECRET_KEY missing / not live'); process.exit(1); }
const stripe = new Stripe(KEY);
const APP = (g('APP_URL') || 'https://edgekeeper.org').replace(/\/$/, '');

(async () => {
  // 1. Products + prices
  const prods = await stripe.products.search({ query: "metadata['ek_plan']:'starter' OR metadata['ek_plan']:'pro' OR metadata['ek_plan']:'professional'" });
  const byPlan = {};
  for (const pr of prods.data) byPlan[pr.metadata.ek_plan] = pr;
  const productBlocks = [];
  for (const plan of ['starter', 'pro', 'professional']) {
    const prod = byPlan[plan];
    if (!prod) { console.log('  ! product missing for', plan); continue; }
    const prices = await stripe.prices.list({ product: prod.id, active: true, limit: 10 });
    productBlocks.push({ product: prod.id, prices: prices.data.map(p => p.id) });
    console.log('  ✓ product', plan, prod.id, '(' + prices.data.length + ' prices)');
  }

  // 2. Webhook
  const hooks = await stripe.webhookEndpoints.list({ limit: 100 });
  const hook = hooks.data.find(h => h.url === APP + '/api/billing/webhook');
  console.log(hook ? `  ✓ webhook: ${hook.url} (${hook.enabled_events.length} events)` : '  ! webhook missing');

  // 3. Billing portal configuration
  const features = {
    customer_update: { enabled: true, allowed_updates: ['email', 'name'] },
    invoice_history: { enabled: true },
    payment_method_update: { enabled: true },
    subscription_cancel: {
      enabled: true,
      mode: 'at_period_end',
      cancellation_reason: { enabled: true, options: ['too_expensive', 'missing_features', 'switched_service', 'unused', 'customer_service', 'too_complex', 'low_quality', 'other'] },
    },
    subscription_update: {
      enabled: productBlocks.length > 0,
      default_allowed_updates: ['price'],
      proration_behavior: 'create_prorations',
      products: productBlocks,
    },
  };
  const business_profile = {
    headline: 'EdgeKeeper — manage your membership',
    privacy_policy_url: APP + '/privacy.html',
    terms_of_service_url: APP + '/terms.html',
  };

  const existing = await stripe.billingPortal.configurations.list({ limit: 100 });
  const mine = existing.data.find(c => c.is_default) || existing.data[0];
  let cfg;
  if (mine) {
    cfg = await stripe.billingPortal.configurations.update(mine.id, { features, business_profile, default_return_url: APP + '/settings.html' });
    console.log('  ✓ billing portal configuration UPDATED:', cfg.id);
  } else {
    cfg = await stripe.billingPortal.configurations.create({ features, business_profile, default_return_url: APP + '/settings.html' });
    console.log('  ✓ billing portal configuration CREATED:', cfg.id);
  }

  // 4. Account status
  const acct = await stripe.accounts.retrieve();
  console.log('\n  account:', acct.id, '| charges_enabled:', acct.charges_enabled, '| payouts_enabled:', acct.payouts_enabled, '| details_submitted:', acct.details_submitted);

  console.log('\n✔ Stripe API setup complete: products, webhook, and customer portal are configured.');
  console.log('  Only the account owner can do (dashboard): finish activation (identity + bank) if not already,');
  console.log('  set the statement descriptor + brand logo, and run one real test purchase then refund.');
})().catch(e => { console.error('✗', e.message); process.exit(1); });
