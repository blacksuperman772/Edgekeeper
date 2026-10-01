// lib/metaapi.js
//
// Thin wrapper around the MetaApi (https://metaapi.cloud) REST API for
// one-tap broker linking. We use the "end user configures credentials"
// flow: create a cloud account WITHOUT login/password, hand the user a
// MetaApi-hosted configuration link where they enter their broker login and
// password directly, then read the account state back to feed the Guardian.
//
// EdgeKeeper never receives or stores the broker password — it lives only
// inside MetaApi. See supabase/migrations/031_broker_connections.sql.
//
// Requires env METAAPI_TOKEN (the account API token from
// https://app.metaapi.cloud/token). If unset, isEnabled() is false and the
// server should not offer the one-tap flow.

const crypto = require('crypto');

const PROVISIONING_BASE =
  process.env.METAAPI_PROVISIONING_URL ||
  'https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai';

function clientBase(region) {
  // Region-scoped client API host. Defaults to new-york if region unknown.
  const r = (region || 'new-york').trim();
  return `https://mt-client-api-v1.${r}.agiliumtrade.ai`;
}

function token() {
  return process.env.METAAPI_TOKEN || '';
}

function isEnabled() {
  return !!token();
}

async function req(url, { method = 'GET', body, extraHeaders } = {}) {
  const headers = {
    'auth-token': token(),
    Accept: 'application/json',
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(extraHeaders || {}),
  };
  const res = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (_) { /* non-JSON */ }

  if (!res.ok) {
    const message =
      (json && (json.message || json.error)) || text || `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.details = json && json.details;
    err.body = json;
    throw err;
  }
  return { status: res.status, json };
}

// Create a cloud trading account. Two modes:
//   1) In-app: pass login + password and MetaApi provisions + connects directly.
//   2) Hosted: omit login/password and hand the user a configuration-link instead.
// The password is used only for this one provisioning call — it is never returned,
// logged, or persisted on the EdgeKeeper side (MetaApi holds it, encrypted). A 202
// means broker settings detection is still running — retry with the SAME transactionId.
async function createAccount({ platform, server, name, transactionId, login, password }) {
  if (!['mt4', 'mt5'].includes(platform)) {
    throw new Error('platform must be mt4 or mt5');
  }
  const tid = transactionId || crypto.randomBytes(16).toString('hex'); // 32 chars
  const body = {
    name: name || 'EdgeKeeper Guardian',
    server,
    platform,
    magic: 0,
    manualTrades: true,          // we only observe; never place trades
    metastatsApiEnabled: false,  // we derive streak/drawdown/P&L from deals ourselves — MetaStats is an avoidable per-account charge
  };
  // In-app credential mode: MetaApi connects immediately, no configuration link.
  if (login && password) {
    body.login = String(login);
    body.password = String(password);
  }
  const { status, json } = await req(`${PROVISIONING_BASE}/users/current/accounts`, {
    method: 'POST',
    body,
    extraHeaders: { 'transaction-id': tid },
  });
  return { pending: status === 202, transactionId: tid, ...(json || {}) };
}

// Generate the MetaApi-hosted link where the end user enters their broker
// login and password. ttlInDays defaults to 7.
async function createConfigurationLink(accountId, ttlInDays = 7) {
  const { json } = await req(
    `${PROVISIONING_BASE}/users/current/accounts/${accountId}/configuration-link?ttlInDays=${ttlInDays}`,
    { method: 'PUT' },
  );
  return json && json.configurationLink;
}

// Read the provisioning-side account record: state, connectionStatus, region.
async function getAccount(accountId) {
  const { json } = await req(
    `${PROVISIONING_BASE}/users/current/accounts/${accountId}`,
  );
  return json;
}

// Read live terminal account information (balance, equity, margin, ...).
async function getAccountInformation(accountId, region) {
  const { json } = await req(
    `${clientBase(region)}/users/current/accounts/${accountId}/account-information`,
  );
  return json;
}

// Read open positions.
async function getPositions(accountId, region) {
  const { json } = await req(
    `${clientBase(region)}/users/current/accounts/${accountId}/positions`,
  );
  return Array.isArray(json) ? json : [];
}

// Read closed-trade history (deals) between two ISO timestamps. This is what the
// Guardian needs to compute losing streaks and realized daily P&L — open
// positions alone can't show a trader who already closed five losers today.
async function getDeals(accountId, region, sinceISO, untilISO) {
  const start = encodeURIComponent(sinceISO);
  const end = encodeURIComponent(untilISO || new Date(Date.now() + 60000).toISOString());
  const { json } = await req(
    `${clientBase(region)}/users/current/accounts/${accountId}/history-deals/time/${start}/${end}`,
  );
  return Array.isArray(json) ? json : [];
}

// Read pending (not yet triggered) orders. A resting stop can fire hours after
// a breach, so the Guardian lock has to clear these too, not just open positions.
async function getOrders(accountId, region) {
  const { json } = await req(
    `${clientBase(region)}/users/current/accounts/${accountId}/orders`,
  );
  return Array.isArray(json) ? json : [];
}

// ── WRITE OPERATIONS ─────────────────────────────────────────────────────────
// These act on a funded account. They exist ONLY to serve the Guardian hard lock
// and must never be called without the trader's recorded 'protect' consent —
// server.js enforces that gate; this module deliberately holds no policy.
async function closePosition(accountId, region, positionId) {
  const { json } = await req(
    `${clientBase(region)}/users/current/accounts/${accountId}/trade`,
    { method: 'POST', body: { actionType: 'POSITION_CLOSE_ID', positionId: String(positionId) } },
  );
  return json; // { numericCode, stringCode: 'TRADE_RETCODE_DONE', ... }
}

async function cancelOrder(accountId, region, orderId) {
  const { json } = await req(
    `${clientBase(region)}/users/current/accounts/${accountId}/trade`,
    { method: 'POST', body: { actionType: 'ORDER_CANCEL', orderId: String(orderId) } },
  );
  return json;
}

// Remove the cloud account (on unlink). Best-effort.
async function deleteAccount(accountId) {
  await req(`${PROVISIONING_BASE}/users/current/accounts/${accountId}`, {
    method: 'DELETE',
  });
}

// Pause billing for an idle account: undeploy stops the cloud instance (the meter
// stops) without deleting the account, so credentials and config are preserved.
async function undeployAccount(accountId) {
  await req(`${PROVISIONING_BASE}/users/current/accounts/${accountId}/undeploy`, {
    method: 'POST',
  });
}

// Resume a paused account: redeploy restarts the instance and it reconnects to the
// broker (~1 min). Called when the trader returns so the Guardian comes back online.
async function deployAccount(accountId) {
  await req(`${PROVISIONING_BASE}/users/current/accounts/${accountId}/deploy`, {
    method: 'POST',
  });
}

module.exports = {
  isEnabled,
  createAccount,
  createConfigurationLink,
  getAccount,
  getAccountInformation,
  getPositions,
  getOrders,
  getDeals,
  closePosition,
  cancelOrder,
  deleteAccount,
  undeployAccount,
  deployAccount,
};
