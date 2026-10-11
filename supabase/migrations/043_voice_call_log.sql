-- ============================================================
-- EdgeKeeper — Migration 043
-- Voice call log: one row per call issued, per mentor.
-- Gives the voice agent real temporal awareness — time since the
-- last call, and whether the line just dropped and was redialed —
-- without ever fabricating it. Service role reads/writes; the user
-- owns their own rows under RLS.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.voice_calls (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor     TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.voice_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voice_calls: user owns their rows"
  ON public.voice_calls FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS voice_calls_user_mentor_time
  ON public.voice_calls(user_id, mentor, started_at DESC);
