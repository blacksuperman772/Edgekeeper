-- 019: Session Reviews, Research Insights, Network Rooms + Messages

-- Session reviews: traders log post-session self-assessments
CREATE TABLE IF NOT EXISTS session_reviews (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentor           TEXT        NOT NULL DEFAULT 'mike' CHECK (mentor IN ('mike','ashley')),
  review_type      TEXT        NOT NULL DEFAULT 'session'
                               CHECK (review_type IN ('session','daily','weekly','monthly')),
  discipline_score INTEGER     CHECK (discipline_score >= 0 AND discipline_score <= 100),
  rule_followed    BOOLEAN,
  emotional_state  TEXT        CHECK (emotional_state IN ('calm','focused','anxious','frustrated','confident','distracted','neutral')),
  what_worked      TEXT        CHECK (char_length(what_worked) <= 1000),
  what_didnt       TEXT        CHECK (char_length(what_didnt) <= 1000),
  note             TEXT        CHECK (char_length(note) <= 500),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS session_reviews_user_created
  ON session_reviews (user_id, created_at DESC);

ALTER TABLE session_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own session_reviews"
  ON session_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own session_reviews"
  ON session_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Research insights: weekly AI-generated behavioral observations per user
CREATE TABLE IF NOT EXISTS research_insights (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_key   TEXT        NOT NULL,
  insight    TEXT        NOT NULL CHECK (char_length(insight) <= 3000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_key)
);

ALTER TABLE research_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own research_insights"
  ON research_insights FOR SELECT USING (auth.uid() = user_id);

-- Network rooms: admin-created community rooms
CREATE TABLE IF NOT EXISTS network_rooms (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE network_rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads network_rooms"
  ON network_rooms FOR SELECT USING (true);

-- Network messages: admin-only posts (Mike or Ashley voice) into rooms
CREATE TABLE IF NOT EXISTS network_messages (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  room_slug   TEXT        NOT NULL REFERENCES network_rooms(slug) ON DELETE CASCADE,
  author_name TEXT        NOT NULL DEFAULT 'Mike',
  author_role TEXT        NOT NULL DEFAULT 'mike' CHECK (author_role IN ('mike','ashley','system')),
  content     TEXT        NOT NULL CHECK (char_length(content) <= 2000),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS network_messages_room_created
  ON network_messages (room_slug, created_at DESC);

ALTER TABLE network_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads network_messages"
  ON network_messages FOR SELECT USING (true);

-- Seed the three community rooms
INSERT INTO network_rooms (slug, name, description) VALUES
  ('discipline-room', 'Discipline Room',    'Daily accountability and rule adherence.'),
  ('recovery-room',   'Recovery Room',      'Bouncing back from hard sessions.'),
  ('performance-room','Performance Room',   'Breaking down what worked and why.')
ON CONFLICT (slug) DO NOTHING;

-- Readiness score computation function
CREATE OR REPLACE FUNCTION compute_readiness_score(p_user_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_journal     INTEGER := 0;
  v_violations  INTEGER := 0;
  v_messages    INTEGER := 0;
  v_milestones  INTEGER := 0;
  v_score       INTEGER := 0;
BEGIN
  SELECT COUNT(*) INTO v_journal    FROM journal_entries WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_violations FROM rule_violations  WHERE user_id = p_user_id;
  SELECT COALESCE(SUM(message_count),0)
    INTO v_messages
    FROM message_usage WHERE user_id = p_user_id;
  SELECT COUNT(*) INTO v_milestones FROM milestones WHERE user_id = p_user_id;

  -- Journal entries: 3pts each, max 30
  v_score := v_score + LEAST(v_journal * 3, 30);
  -- Milestones: 6pts each, max 30
  v_score := v_score + LEAST(v_milestones * 6, 30);
  -- Message engagement: 1pt per 5 messages, max 20
  v_score := v_score + LEAST((v_messages / 5)::INTEGER, 20);
  -- Violations: subtract 2 each, floor 0
  v_score := GREATEST(v_score - (v_violations * 2), 0);

  RETURN LEAST(v_score, 100);
END;
$$;
