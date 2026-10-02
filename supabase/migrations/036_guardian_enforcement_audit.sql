-- ============================================================
-- EdgeKeeper — Guardian hard-lock: consent record + audit trail
-- Migration: 036_guardian_enforcement_audit.sql
--
-- The Guardian can now CLOSE POSITIONS on a funded account. That is only
-- defensible with (a) provable, timestamped consent and (b) an immutable
-- record of every action taken and why. This migration adds both.
--
-- guardian_level already stores the contract tier ('observe'|'warn'|'slow'|
-- 'protect'); only 'protect' authorises the lock. What was missing was WHEN
-- they agreed and to WHAT WORDING — needed to answer "prove they consented".
-- ============================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS guardian_consent_at   timestamptz,
  ADD COLUMN IF NOT EXISTS guardian_consent_text text,
  ADD COLUMN IF NOT EXISTS guardian_revoked_at   timestamptz;

-- Append-only record of every enforcement action. Never updated, never deleted.
CREATE TABLE IF NOT EXISTS public.guardian_actions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  at           timestamptz NOT NULL DEFAULT now(),
  -- 'lock_engaged' | 'position_closed' | 'order_cancelled' | 'lock_released'
  -- | 'blocked_no_consent' | 'enforcement_failed'
  action       text NOT NULL,
  channel      text,            -- 'metaapi' | 'ea'
  lock_level   integer,
  reason       text,            -- human-readable breach reason shown to the trader
  ref_id       text,            -- position id / order id acted on
  symbol       text,
  volume       numeric,
  -- account state at the moment of action (proves the breach was real)
  snapshot     jsonb,
  -- broker/API result, incl. failure codes
  result       jsonb
);

CREATE INDEX IF NOT EXISTS guardian_actions_user_at_idx
  ON public.guardian_actions (user_id, at DESC);

ALTER TABLE public.guardian_actions ENABLE ROW LEVEL SECURITY;

-- The trader can always read their own record. Writes are service-role only.
DROP POLICY IF EXISTS guardian_actions_own_read ON public.guardian_actions;
CREATE POLICY guardian_actions_own_read ON public.guardian_actions
  FOR SELECT USING (auth.uid() = user_id);
