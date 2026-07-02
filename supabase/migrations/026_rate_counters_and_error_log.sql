-- 026_rate_counters_and_error_log.sql
--
-- Production-readiness infrastructure (serverless-safe):
--
-- 1) rate_counters + bump_counter(): shared fixed-window counters.
--    express-rate-limit keeps its counts in instance memory; on Vercel each
--    instance has its own counters, so "15/min" is really 15/min *per instance*
--    and the protection on expensive endpoints (OpenAI proxies, token mints) is
--    far weaker than configured. This table is the single source of truth across
--    all instances. Same mechanism doubles as the global AI spend meter
--    (bucket='ai_day', amount=tokens).
--
-- 2) server_errors: structured error capture with admin visibility, so
--    production failures are observable without an external APM account.
--    (Sentry can be layered on later; this is the always-on floor.)
--
-- Both tables are accessed exclusively through the service-role key. RLS is
-- enabled with no policies: anon/authenticated clients get nothing; the service
-- role bypasses RLS by design.

CREATE TABLE IF NOT EXISTS public.rate_counters (
  bucket       text        NOT NULL,
  key          text        NOT NULL,
  window_start timestamptz NOT NULL,
  count        bigint      NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, key, window_start)
);

ALTER TABLE public.rate_counters ENABLE ROW LEVEL SECURITY;

-- Atomically add `p_amount` to the counter for the current fixed window and
-- return the new total. One round-trip, race-safe under concurrency.
CREATE OR REPLACE FUNCTION public.bump_counter(
  p_bucket         text,
  p_key            text,
  p_window_seconds integer,
  p_amount         bigint DEFAULT 1
) RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window timestamptz;
  v_count  bigint;
BEGIN
  v_window := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);
  INSERT INTO public.rate_counters (bucket, key, window_start, count)
  VALUES (p_bucket, p_key, v_window, p_amount)
  ON CONFLICT (bucket, key, window_start)
  DO UPDATE SET count = public.rate_counters.count + p_amount
  RETURNING count INTO v_count;
  RETURN v_count;
END;
$$;

-- Old windows accumulate one row per (bucket,key,window); cheap to clear.
-- Called opportunistically from the server (no pg_cron dependency).
CREATE OR REPLACE FUNCTION public.prune_rate_counters(p_older_than_hours integer DEFAULT 48)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.rate_counters
  WHERE window_start < now() - make_interval(hours => p_older_than_hours);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

CREATE TABLE IF NOT EXISTS public.server_errors (
  id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at      timestamptz NOT NULL DEFAULT now(),
  source  text,
  message text,
  stack   text,
  meta    jsonb
);

CREATE INDEX IF NOT EXISTS server_errors_at_idx ON public.server_errors (at DESC);

ALTER TABLE public.server_errors ENABLE ROW LEVEL SECURITY;
