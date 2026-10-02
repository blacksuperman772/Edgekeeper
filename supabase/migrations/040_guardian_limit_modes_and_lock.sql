-- Guardian limits: let daily-loss and drawdown be set in % OR a money amount,
-- and add a commitment lock so a saved rule set can't be loosened for 24h.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS risk_max_daily_loss_mode TEXT DEFAULT 'pct',
  ADD COLUMN IF NOT EXISTS risk_max_drawdown_mode   TEXT DEFAULT 'pct',
  ADD COLUMN IF NOT EXISTS rules_locked_until        TIMESTAMPTZ;

-- The entered value lives in the existing *_pct columns; the *_mode column says
-- whether that number is a percent or a money amount. calcLockLevel converts a
-- money amount to % of balance at evaluation time.
