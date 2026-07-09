-- 031_broker_connections.sql
--
-- One-tap broker linking via MetaApi (https://metaapi.cloud).
--
-- This is the "easier way to link accounts" — including on mobile — that
-- replaces the desktop-only EA / webhook flow. The user enters their broker
-- login and password directly on MetaApi's own hosted configuration page, so
-- EdgeKeeper never sees or stores the broker password. We only keep the
-- MetaApi account id and connection status; MetaApi's cloud terminal streams
-- the account state, which the server maps into the existing guardian_data
-- row and rule engine.
--
-- SECURITY: there is deliberately NO password column here. Do not add one.
-- Broker credentials live only inside MetaApi.
--
-- Service-role access only: RLS enabled with no policies (the server reads and
-- writes exclusively via supabaseAdmin; clients go through /api/guardian/link*).

CREATE TABLE IF NOT EXISTS public.broker_connections (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL,
  metaapi_account_id text,
  platform           text,                              -- 'mt4' | 'mt5'
  server             text,                              -- broker server name
  region             text,                              -- MetaApi deploy region (for client-api URL)
  account_name       text,                              -- human-readable label
  status             text NOT NULL DEFAULT 'pending_credentials',
                                                        -- pending_credentials | connecting | connected | error | disconnected
  status_detail      text,                              -- last error / info message
  last_sync_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- One active broker connection per user (mirrors guardian_data's one-row-per-user shape).
CREATE UNIQUE INDEX IF NOT EXISTS broker_connections_user_idx ON public.broker_connections (user_id);

ALTER TABLE public.broker_connections ENABLE ROW LEVEL SECURITY;
