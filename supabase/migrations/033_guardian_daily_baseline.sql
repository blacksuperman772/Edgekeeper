-- ============================================================
-- EdgeKeeper — Guardian daily baseline (real daily P&L + drawdown)
-- Migration: 033_guardian_daily_baseline.sql
-- The Guardian needs a trading-day boundary to compute true daily loss %
-- and intraday drawdown from a linked account. day_key detects rollover;
-- day_start_balance anchors daily P&L; day_peak_equity anchors drawdown.
-- ============================================================

ALTER TABLE public.guardian_data
  ADD COLUMN IF NOT EXISTS day_key            text,
  ADD COLUMN IF NOT EXISTS day_start_balance  numeric,
  ADD COLUMN IF NOT EXISTS day_peak_equity    numeric,
  ADD COLUMN IF NOT EXISTS day_realized_pnl   numeric NOT NULL DEFAULT 0;
