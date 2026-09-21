-- EdgeKeeper — Web Push subscriptions and notification preferences
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS push_important BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS push_messages BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS push_reminders BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS push_system BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS push_marketing BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  subscription JSONB NOT NULL,
  device_label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS push_subscriptions_own ON public.push_subscriptions;
CREATE POLICY push_subscriptions_own ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx
  ON public.push_subscriptions(user_id);

CREATE TABLE IF NOT EXISTS public.push_notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  entity_id TEXT,
  deep_link TEXT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0
);

ALTER TABLE public.push_notification_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS push_notification_log_own ON public.push_notification_log;
CREATE POLICY push_notification_log_own ON public.push_notification_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS push_notification_log_user_idx
  ON public.push_notification_log(user_id, sent_at DESC);
