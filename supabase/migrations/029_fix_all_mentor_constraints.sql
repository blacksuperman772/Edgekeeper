-- 029_fix_all_mentor_constraints.sql
--
-- Systemic fix. 028 patched three tables; a full audit (pg_constraint LIKE
-- '%mike%') found eight more still pinned to the retired mentor names
-- ('mike','ashley'). Any write of a canonical mentor slug (marcus/iris/theo)
-- to these columns fails with a 23514 check violation — this is what broke
-- POST /api/notebook (the mentor's per-session memory) and lurks behind
-- message_usage, discipline_scores, mentor_messages, journal_entries.mentor_context,
-- trading_rules.origin_mentor and network_messages.author_role.
--
-- Canonical mentor values are marcus / iris / theo (see canonicalMentor); the
-- legacy names are kept so existing rows stay valid, plus the per-column extras
-- ('self' for rule origin, 'system' for network authorship). Non-destructive —
-- only loosens constraints. All are NULL-tolerant (mentor = ANY(...) passes NULL),
-- matching the originals.

DO $$
DECLARE
  MENTORS text := $q$'marcus','iris','theo','mike','ashley'$q$;
BEGIN
  -- Plain mentor columns
  EXECUTE 'ALTER TABLE public.user_profiles   DROP CONSTRAINT IF EXISTS user_profiles_mentor_check';
  EXECUTE 'ALTER TABLE public.user_profiles   ADD  CONSTRAINT user_profiles_mentor_check   CHECK (mentor = ANY (ARRAY['||MENTORS||']))';
  EXECUTE 'ALTER TABLE public.notebooks       DROP CONSTRAINT IF EXISTS notebooks_mentor_check';
  EXECUTE 'ALTER TABLE public.notebooks       ADD  CONSTRAINT notebooks_mentor_check       CHECK (mentor = ANY (ARRAY['||MENTORS||']))';
  EXECUTE 'ALTER TABLE public.message_usage   DROP CONSTRAINT IF EXISTS message_usage_mentor_check';
  EXECUTE 'ALTER TABLE public.message_usage   ADD  CONSTRAINT message_usage_mentor_check   CHECK (mentor = ANY (ARRAY['||MENTORS||']))';
  EXECUTE 'ALTER TABLE public.discipline_scores DROP CONSTRAINT IF EXISTS discipline_scores_mentor_check';
  EXECUTE 'ALTER TABLE public.discipline_scores ADD CONSTRAINT discipline_scores_mentor_check CHECK (mentor = ANY (ARRAY['||MENTORS||']))';
  EXECUTE 'ALTER TABLE public.mentor_messages DROP CONSTRAINT IF EXISTS mentor_messages_mentor_check';
  EXECUTE 'ALTER TABLE public.mentor_messages ADD  CONSTRAINT mentor_messages_mentor_check CHECK (mentor = ANY (ARRAY['||MENTORS||']))';

  -- Differently-named columns / extra allowed values
  EXECUTE 'ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_mentor_context_check';
  EXECUTE 'ALTER TABLE public.journal_entries ADD  CONSTRAINT journal_entries_mentor_context_check CHECK (mentor_context = ANY (ARRAY['||MENTORS||']))';
  EXECUTE 'ALTER TABLE public.trading_rules   DROP CONSTRAINT IF EXISTS trading_rules_origin_mentor_check';
  EXECUTE 'ALTER TABLE public.trading_rules   ADD  CONSTRAINT trading_rules_origin_mentor_check CHECK (origin_mentor = ANY (ARRAY['||MENTORS||',''self''])) ';
  EXECUTE 'ALTER TABLE public.network_messages DROP CONSTRAINT IF EXISTS network_messages_author_role_check';
  EXECUTE 'ALTER TABLE public.network_messages ADD CONSTRAINT network_messages_author_role_check CHECK (author_role = ANY (ARRAY['||MENTORS||',''system''])) ';
END $$;
