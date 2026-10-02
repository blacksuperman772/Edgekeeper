-- ============================================================
-- EdgeKeeper — Signup jurisdiction record
-- Migration: 037_signup_jurisdiction.sql
-- Store where the account holder said they are (self-attested) and where they
-- were detected (IP country), so a "we can't serve your region" decision is
-- recorded, not just enforced in the moment.
-- ============================================================

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS country          text,   -- self-attested ISO-3166 alpha-2
  ADD COLUMN IF NOT EXISTS signup_ip_country text;  -- detected at signup (Vercel header)
