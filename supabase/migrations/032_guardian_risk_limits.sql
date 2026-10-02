-- ============================================================
-- EdgeKeeper — Custom Guardian risk limits + breach-alert dedup
-- Migration: 032_guardian_risk_limits.sql
-- Fellow+ traders set their own thresholds; the intervention ladder
-- scales to them. last_alert_level dedupes breach notifications so we
-- alert once per escalation, not on every poll.
-- ============================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS risk_max_daily_loss_pct numeric
    CHECK (risk_max_daily_loss_pct IS NULL OR (risk_max_daily_loss_pct > 0 AND risk_max_daily_loss_pct <= 100)),
  ADD COLUMN IF NOT EXISTS risk_max_drawdown_pct numeric
    CHECK (risk_max_drawdown_pct IS NULL OR (risk_max_drawdown_pct > 0 AND risk_max_drawdown_pct <= 100)),
  ADD COLUMN IF NOT EXISTS risk_max_loss_streak integer
    CHECK (risk_max_loss_streak IS NULL OR (risk_max_loss_streak >= 1 AND risk_max_loss_streak <= 50)),
  ADD COLUMN IF NOT EXISTS risk_max_lots numeric
    CHECK (risk_max_lots IS NULL OR (risk_max_lots > 0 AND risk_max_lots <= 1000));

ALTER TABLE public.guardian_data
  ADD COLUMN IF NOT EXISTS last_alert_level integer NOT NULL DEFAULT 0;
