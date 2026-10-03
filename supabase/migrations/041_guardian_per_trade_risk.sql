-- Phase 1 of the Guardian trade-watch: per-trade risk allowance + live position risk.
-- risk_per_trade_pct already exists (039); add its unit mode so it can be % or $.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS risk_per_trade_mode TEXT DEFAULT 'pct';

-- What Iris reads off the live account each sync:
--   risk_allowance_usd  — what you're permitted to risk on the next trade ($)
--   open_risk_usd       — total money at risk across open positions (loss if every stop hits)
--   positions_no_stop   — how many open positions have no stop loss (unbounded risk)
--   last_trade_alert_key — dedup key so the "no stop / over your line" push fires once per condition
ALTER TABLE guardian_data
  ADD COLUMN IF NOT EXISTS risk_allowance_usd   NUMERIC,
  ADD COLUMN IF NOT EXISTS open_risk_usd        NUMERIC,
  ADD COLUMN IF NOT EXISTS positions_no_stop    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_trade_alert_key TEXT;
