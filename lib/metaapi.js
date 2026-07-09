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

// Create a cloud trading account WITHOUT credentials. The user supplies
// login/password later via the configuration link. Returns { id, state } or
// throws. A 202 means broker settings detection is still running — the caller
// should retry with the SAME transactionId.
async function createAccount({ platform, server, name, transactionId }) {
  if (!['mt4', 'mt5'].includes(platform)) {
    throw new Error('platform must be mt4 or mt5');
  }
  const tid = transactionId || crypto.randomBytes(16).toString('hex'); // 32 chars
  const { status, json } = await req(`${PROVISIONING_BASE}/users/current/accounts`, {
    method: 'POST',
    body: {
      name: name || 'EdgeKeeper Guardian',
      server,
      platform,
      magic: 0,
      manualTrades: true,          // we only observe; never place trades
      metastatsApiEnabled: true,
      // no login/password — configured by the end user via the link
    },
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

// Remove the cloud account (on unlink). Best-effort.
async function deleteAccount(accountId) {
  await req(`${PROVISIONING_BASE}/users/current/accounts/${accountId}`, {
    method: 'DELETE',
  });
}

module.exports = {
  isEnabled,
  createAccount,
  createConfigurationLink,
  getAccount,
  getAccountInformation,
  getPositions,
  deleteAccount,
};
