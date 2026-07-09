#!/usr/bin/env node
/**
 * stripe-webhook.mjs — create (or replace) the EdgeKeeper Stripe webhook endpoint
 * and capture its signing secret. Writes STRIPE_WEBHOOK_SECRET=... to
 * .stripe-whsec.env (temp, deleted by the caller). Idempotent: deletes any
 * existing endpoint pointing at the same URL first so we always get a fresh,
 * known secret (Stripe only reveals the secret at creation time).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
const g = (k) => { const m = env.match(new RegExp('^' + k + '=(.*)$', 'm')); return m ? m[1].trim() : ''; };

const KEY = g('STRIPE_SECRET_KEY');
if (!/^sk_(live|test)_/.test(KEY)) { console.error('✗ STRIPE_SECRET_KEY missing/invalid'); process.exit(1); }
const stripe = new Stripe(KEY);

const URL = (g('APP_URL') || 'https://edgekeeper.org').replace(/\/$/, '') + '/api/billing/webhook';
const EVENTS = ['checkout.session.completed', 'customer.subscription.updated', 'customer.subscription.deleted'];

(async () => {
  // Remove any existing endpoint for this exact URL to avoid duplicates.
  const list = await stripe.webhookEndpoints.list({ limit: 100 });
  for (const ep of list.data) {
    if (ep.url === URL) { await stripe.webhookEndpoints.del(ep.id); console.log('· removed existing endpoint', ep.id); }
  }

  const ep = await stripe.webhookEndpoints.create({
    url: URL,
    enabled_events: EVENTS,
    description: 'EdgeKeeper subscription events',
  });

  console.log('✓ webhook endpoint created:', ep.id);
  console.log('  url:', ep.url);
  console.log('  events:', EVENTS.join(', '));
  console.log('  secret:', ep.secret ? ep.secret.slice(0, 12) + '…(captured)' : 'MISSING');
  if (!ep.secret) { console.error('✗ no secret returned'); process.exit(1); }
  fs.writeFileSync(path.join(__dirname, '..', '.stripe-whsec.env'), `STRIPE_WEBHOOK_SECRET=${ep.secret}\n`);
})().catch(e => { console.error('✗', e.message); process.exit(1); });
