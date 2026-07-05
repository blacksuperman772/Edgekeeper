-- 030_backfill_mentor_slugs.sql
--
-- Data backfill paired with the server.js canonicalization (mike→marcus,
-- ashley→iris). Existing production rows were written by the old code under the
-- retired internal slugs; the new code reads/writes canonical names, so without
-- this backfill a user's old history (notebook memory, passport, journal
-- context, rules, etc.) would be orphaned — a query for mentor='marcus' would
-- not find their mentor='mike' rows.
--
-- Idempotent (WHERE-guarded) and non-destructive: only renames legacy values,
-- leaves canonical rows untouched. Constraints (028/029) already accept both.
--
-- Deliberately NOT touched:
--   * network_messages.author_role — the network feed's CSS colours by
--     [data-role="mike"|"ashley"]; renaming would need a coupled UI change.
--   * office_messages.worker_id     — holds 'founder'/'director', not mentor slugs.
--   * rule_violation_summary        — a VIEW over trading_rules (derives its value).

UPDATE public.behavioral_reports SET mentor='marcus' WHERE mentor='mike';
UPDATE public.behavioral_reports SET mentor='iris'   WHERE mentor='ashley';

UPDATE public.discipline_scores  SET mentor='marcus' WHERE mentor='mike';
UPDATE public.discipline_scores  SET mentor='iris'   WHERE mentor='ashley';

UPDATE public.journal_entries    SET mentor_context='marcus' WHERE mentor_context='mike';
UPDATE public.journal_entries    SET mentor_context='iris'   WHERE mentor_context='ashley';

UPDATE public.mentor_messages    SET mentor='marcus' WHERE mentor='mike';
UPDATE public.mentor_messages    SET mentor='iris'   WHERE mentor='ashley';

UPDATE public.message_usage      SET mentor='marcus' WHERE mentor='mike';
UPDATE public.message_usage      SET mentor='iris'   WHERE mentor='ashley';

UPDATE public.notebooks          SET mentor='marcus' WHERE mentor='mike';
UPDATE public.notebooks          SET mentor='iris'   WHERE mentor='ashley';

UPDATE public.passport_entries   SET mentor='marcus' WHERE mentor='mike';
UPDATE public.passport_entries   SET mentor='iris'   WHERE mentor='ashley';

UPDATE public.session_reviews    SET mentor='marcus' WHERE mentor='mike';
UPDATE public.session_reviews    SET mentor='iris'   WHERE mentor='ashley';

UPDATE public.trading_rules      SET origin_mentor='marcus' WHERE origin_mentor='mike';
UPDATE public.trading_rules      SET origin_mentor='iris'   WHERE origin_mentor='ashley';

UPDATE public.user_profiles      SET mentor='marcus' WHERE mentor='mike';
UPDATE public.user_profiles      SET mentor='iris'   WHERE mentor='ashley';

UPDATE public.vault_entries      SET mentor='marcus' WHERE mentor='mike';
UPDATE public.vault_entries      SET mentor='iris'   WHERE mentor='ashley';

UPDATE public.voice_sessions     SET mentor='marcus' WHERE mentor='mike';
UPDATE public.voice_sessions     SET mentor='iris'   WHERE mentor='ashley';
