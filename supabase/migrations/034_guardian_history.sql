-- ============================================================
-- EdgeKeeper — Guardian daily history (memory + trends)
-- Migration: 034_guardian_history.sql
-- One row per user per trading day. Gives Iris memory ("third losing day
-- this week") and powers the chamber trend line. Upserted on every sync;
-- peak_lock_level / max_drawdown accumulate the worst of the day.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.guardian_history (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL,
  day_key            text NOT NULL,
  balance            numeric,
  equity             numeric,
  daily_pnl          numeric,
  daily_pnl_pct      numeric,
  max_drawdown_pct   numeric,
  consecutive_losses integer,
  peak_lock_level    integer NOT NULL DEFAULT 1,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS guardian_history_user_day
  ON public.guardian_history (user_id, day_key);
CREATE INDEX IF NOT EXISTS guardian_history_user_recent
  ON public.guardian_history (user_id, day_key DESC);

ALTER TABLE public.guardian_history ENABLE ROW LEVEL SECURITY;
