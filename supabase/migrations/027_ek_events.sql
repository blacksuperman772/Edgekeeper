-- 027_ek_events.sql
--
-- First-party product analytics. The company currently has zero funnel
-- visibility (no analytics events anywhere) — this is the minimum viable
-- foundation: one append-only events table written by the server
-- (POST /api/event), queryable for funnel counts via /api/admin/funnel.
-- No third-party trackers, no cookies beyond an anonymous session id,
-- GDPR-light by construction.
--
-- Service-role access only: RLS enabled with no policies.

CREATE TABLE IF NOT EXISTS public.ek_events (
  id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at      timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  sid     text,
  event   text NOT NULL,
  path    text,
  props   jsonb
);

CREATE INDEX IF NOT EXISTS ek_events_at_idx    ON public.ek_events (at DESC);
CREATE INDEX IF NOT EXISTS ek_events_event_idx ON public.ek_events (event, at DESC);

ALTER TABLE public.ek_events ENABLE ROW LEVEL SECURITY;
