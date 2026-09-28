-- Guardian: outbound breach call + two more configurable limits.
--
-- guardian_phone / guardian_call_consent power the breach phone call
-- (maybeCallGuardianBreach). Both are opt-in: no call happens without a stored
-- E.164 number AND explicit consent.
--
-- risk_per_trade_pct / max_trades_per_day extend the rule engine so a trader can
-- cap the size of a single trade and how many trades they take in a day, alongside
-- the existing daily-loss / drawdown / loss-streak / max-lots limits.

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS guardian_phone         text,
  ADD COLUMN IF NOT EXISTS guardian_call_consent  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS risk_per_trade_pct     numeric,
  ADD COLUMN IF NOT EXISTS max_trades_per_day      integer;
