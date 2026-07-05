-- 028_fix_mentor_check_constraints.sql
--
-- Bug (found by end-to-end feature testing as a paying user): saving to the
-- Vault, the Decision Passport, or a Session Review returned 500. The server
-- writes the canonical mentor slug (canonicalMentor → 'marcus' | 'iris' | 'theo'),
-- but the mentor CHECK constraints on these three tables still only allowed the
-- retired names ('mike','ashley'):
--
--   CHECK (mentor = ANY (ARRAY['mike','ashley']))
--
-- So every Vault lock, Passport entry, and Review submit by a real user violated
-- the constraint (Postgres 23514) and failed. Vault + Passport are paid features,
-- so the top tiers were partly broken end-to-end on the data side — the same class
-- of bug as 025 (subscription_status rejecting 'professional').
--
-- Fix: allow the current canonical names AND keep the legacy ones so any existing
-- rows stay valid. Non-destructive — only loosens the constraints.

ALTER TABLE public.vault_entries
  DROP CONSTRAINT IF EXISTS vault_entries_mentor_check;
ALTER TABLE public.vault_entries
  ADD CONSTRAINT vault_entries_mentor_check
  CHECK (mentor = ANY (ARRAY['marcus','iris','theo','mike','ashley']));

ALTER TABLE public.passport_entries
  DROP CONSTRAINT IF EXISTS passport_entries_mentor_check;
ALTER TABLE public.passport_entries
  ADD CONSTRAINT passport_entries_mentor_check
  CHECK (mentor = ANY (ARRAY['marcus','iris','theo','mike','ashley']));

ALTER TABLE public.session_reviews
  DROP CONSTRAINT IF EXISTS session_reviews_mentor_check;
ALTER TABLE public.session_reviews
  ADD CONSTRAINT session_reviews_mentor_check
  CHECK (mentor = ANY (ARRAY['marcus','iris','theo','mike','ashley']));
