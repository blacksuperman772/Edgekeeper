-- ============================================================
-- EdgeKeeper — Migration 045
-- Reconcile guardian_level with the vocabulary the whole codebase uses.
-- The column's CHECK still allowed the OLD set (warn/intervene/lock/offline),
-- but onboarding, PUT /api/guardian/consent, and shouldEnforceLock all speak
-- observe/warn/slow/protect — so 'protect' (the only value that enables the
-- hard lock) could never be stored, and enforcement could never turn on.
-- Map any legacy values to their nearest new meaning, then swap the CHECK.
-- ============================================================

UPDATE public.user_profiles SET guardian_level = 'slow'    WHERE guardian_level = 'intervene';
UPDATE public.user_profiles SET guardian_level = 'protect' WHERE guardian_level = 'lock';
UPDATE public.user_profiles SET guardian_level = 'observe' WHERE guardian_level = 'offline';

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_guardian_level_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_guardian_level_check
  CHECK (guardian_level IN ('observe', 'warn', 'slow', 'protect'));
