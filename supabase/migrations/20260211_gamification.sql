-- =====================================================
-- FootMatch Gamification — Migration
-- Adds: player_gamification, xp_transactions,
--        user_badges, badge_progress
-- =====================================================

-- New notification types
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'xp_earned';
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'level_up';
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'badge_unlocked';

-- =====================================================
-- TABLES
-- =====================================================

-- Player gamification state (XP, level, streak)
CREATE TABLE IF NOT EXISTS player_gamification (
  user_id         UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp        INTEGER NOT NULL DEFAULT 0,
  level           SMALLINT NOT NULL DEFAULT 1,
  level_name      TEXT NOT NULL DEFAULT 'Débutant',
  current_streak  INTEGER NOT NULL DEFAULT 0,
  best_streak     INTEGER NOT NULL DEFAULT 0,
  last_match_week TEXT,
  cities_played   TEXT[] NOT NULL DEFAULT '{}',
  xp_today        INTEGER NOT NULL DEFAULT 0,
  xp_today_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- XP transaction log (audit trail)
CREATE TABLE IF NOT EXISTS xp_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source      TEXT NOT NULL,
  xp_amount   INTEGER NOT NULL,
  match_id    UUID REFERENCES matches(id) ON DELETE SET NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unlocked badges per user
CREATE TABLE IF NOT EXISTS user_badges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id    TEXT NOT NULL,
  category    TEXT NOT NULL,
  tier        TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_badge UNIQUE (user_id, badge_id)
);

-- Badge progress tracking
CREATE TABLE IF NOT EXISTS badge_progress (
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id    TEXT NOT NULL,
  current     INTEGER NOT NULL DEFAULT 0,
  target      INTEGER NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_gamification_xp ON player_gamification (total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_level ON player_gamification (level DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_source ON xp_transactions (source);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges (user_id);
CREATE INDEX IF NOT EXISTS idx_badge_progress_user ON badge_progress (user_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER trg_gamification_updated_at
  BEFORE UPDATE ON player_gamification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_badge_progress_updated_at
  BEFORE UPDATE ON badge_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- player_gamification: public read, service role write
ALTER TABLE player_gamification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gamification_select_all" ON player_gamification
  FOR SELECT USING (true);
CREATE POLICY "gamification_insert" ON player_gamification
  FOR INSERT WITH CHECK (true);
CREATE POLICY "gamification_update" ON player_gamification
  FOR UPDATE USING (true) WITH CHECK (true);

-- xp_transactions: own read, service role write
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "xp_transactions_select_own" ON xp_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "xp_transactions_insert" ON xp_transactions
  FOR INSERT WITH CHECK (true);

-- user_badges: public read, service role write
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges_select_all" ON user_badges
  FOR SELECT USING (true);
CREATE POLICY "user_badges_insert" ON user_badges
  FOR INSERT WITH CHECK (true);
CREATE POLICY "user_badges_update" ON user_badges
  FOR UPDATE USING (true) WITH CHECK (true);

-- badge_progress: own read, service role write
ALTER TABLE badge_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badge_progress_select_own" ON badge_progress
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "badge_progress_insert" ON badge_progress
  FOR INSERT WITH CHECK (true);
CREATE POLICY "badge_progress_update" ON badge_progress
  FOR UPDATE USING (true) WITH CHECK (true);

-- =====================================================
-- REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE player_gamification;
ALTER PUBLICATION supabase_realtime ADD TABLE user_badges;

-- =====================================================
-- HELPER FUNCTIONS (for badge checks)
-- =====================================================

-- Max matches a user played in a single day
CREATE OR REPLACE FUNCTION get_max_matches_in_day(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(MAX(cnt), 0)
  FROM (
    SELECT m.date, COUNT(*) AS cnt
    FROM match_player_stats mps
    JOIN matches m ON m.id = mps.match_id
    WHERE mps.user_id = p_user_id AND mps.attended = true
    GROUP BY m.date
  ) sub;
$$ LANGUAGE sql STABLE;

-- Count distinct operators a user has played with
CREATE OR REPLACE FUNCTION get_distinct_operators_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(COUNT(DISTINCT m.operator_id), 0)::INTEGER
  FROM match_player_stats mps
  JOIN matches m ON m.id = mps.match_id
  WHERE mps.user_id = p_user_id AND mps.attended = true;
$$ LANGUAGE sql STABLE;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT ALL ON player_gamification TO service_role;
GRANT SELECT ON player_gamification TO authenticated;
GRANT SELECT ON player_gamification TO anon;

GRANT ALL ON xp_transactions TO service_role;
GRANT SELECT ON xp_transactions TO authenticated;

GRANT ALL ON user_badges TO service_role;
GRANT SELECT ON user_badges TO authenticated;
GRANT SELECT ON user_badges TO anon;

GRANT ALL ON badge_progress TO service_role;
GRANT SELECT ON badge_progress TO authenticated;
