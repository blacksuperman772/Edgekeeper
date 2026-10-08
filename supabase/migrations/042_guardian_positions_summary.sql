-- Phase 2: a compact per-position breakdown so Iris can give volatility-aware,
-- per-instrument advice (lots, how tight the stop is, money at risk, stop present).
ALTER TABLE guardian_data
  ADD COLUMN IF NOT EXISTS positions_summary JSONB;
