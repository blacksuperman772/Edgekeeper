-- ============================================================
-- EdgeKeeper — Rule violations from actual trades (not just journal)
-- Migration: 035_rule_violations_trades.sql
-- Until now a violation had to come from a journal entry (journal_entry_id
-- NOT NULL). The Guardian can now read real trade history, so rules can be
-- checked against behaviour. Make the journal link optional, tag the source,
-- and dedup trade-sourced violations to one per (rule, day).
-- ============================================================

ALTER TABLE public.rule_violations
  ALTER COLUMN journal_entry_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS source    text NOT NULL DEFAULT 'journal',
  ADD COLUMN IF NOT EXISTS trade_day text;

-- One trade-sourced violation per rule per day (idempotent re-checks).
CREATE UNIQUE INDEX IF NOT EXISTS rule_violations_trade_dedup
  ON public.rule_violations (user_id, rule_id, trade_day)
  WHERE source = 'trades';
