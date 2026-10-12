-- ============================================================
-- EdgeKeeper — Migration 044
-- Pending in-app call from Iris. When the Guardian escalates into
-- intervention territory, we mark a pending call here; the app polls,
-- and Iris's Chamber rings. Cleared when the trader answers/declines,
-- when it goes stale, or when the account returns to calm.
-- ============================================================

ALTER TABLE public.guardian_data
  ADD COLUMN IF NOT EXISTS call_pending_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS call_reason     TEXT;
