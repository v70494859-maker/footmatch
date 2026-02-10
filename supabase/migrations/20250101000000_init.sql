-- =====================================================
-- FootMatch V4 — Subscription + Operator Model
-- Players: 11.99 EUR/month for unlimited match access
-- Operators: Create/manage matches, earn via Stripe Connect
-- Admins: Platform oversight
-- =====================================================

-- DROP old tables (dependency order, no CASCADE to avoid touching storage schema)
DROP TABLE IF EXISTS organizer_reviews;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS chat_messages;
DROP TABLE IF EXISTS match_messages;
DROP TABLE IF EXISTS ratings;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS match_slots;
DROP TABLE IF EXISTS structures;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS operator_payouts;
DROP TABLE IF EXISTS match_registrations;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS operator_applications;
DROP TABLE IF EXISTS operators;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS publish_payments;
DROP TABLE IF EXISTS match_stats;
DROP TABLE IF EXISTS event_applications;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS academy_registrations;
DROP TABLE IF EXISTS academy_sessions;
DROP TABLE IF EXISTS children;
DROP TABLE IF EXISTS terrains;
DROP TABLE IF EXISTS player_career_stats;
DROP TABLE IF EXISTS match_player_stats;
DROP TABLE IF EXISTS match_results;
DROP TABLE IF EXISTS platform_config;
DROP TABLE IF EXISTS profiles;

-- DROP old enums (tables already dropped above, so no dependents remain)
DROP TYPE IF EXISTS user_role_enum;
DROP TYPE IF EXISTS subscription_status_enum;
DROP TYPE IF EXISTS match_status_enum;
DROP TYPE IF EXISTS application_status_enum;
DROP TYPE IF EXISTS payout_status_enum;
DROP TYPE IF EXISTS terrain_type_enum;
DROP TYPE IF EXISTS registration_status_enum;
DROP TYPE IF EXISTS notification_type_enum;
DROP TYPE IF EXISTS message_type_enum;
DROP TYPE IF EXISTS position_enum;
DROP TYPE IF EXISTS sport_type_enum;
DROP TYPE IF EXISTS team_enum;
DROP TYPE IF EXISTS payment_status_enum;
DROP TYPE IF EXISTS profile_type_enum;
DROP TYPE IF EXISTS session_status_enum;
DROP TYPE IF EXISTS event_status_enum;
DROP TYPE IF EXISTS publish_payment_status_enum;
DROP TYPE IF EXISTS match_quality_enum;
DROP TYPE IF EXISTS match_result_enum;

-- DROP old storage policies (ignore errors if not exist)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Structure photos publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Structure owners can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Structure owners can delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Terrain photos publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload terrain photos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete terrain photos" ON storage.objects;
DROP POLICY IF EXISTS "Documents are private" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Match images publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Operators can upload match images" ON storage.objects;
DROP POLICY IF EXISTS "Operators can delete match images" ON storage.objects;

-- (bucket cleanup skipped — use Storage API)

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role_enum AS ENUM ('player', 'operator', 'admin');
CREATE TYPE subscription_status_enum AS ENUM ('active', 'past_due', 'canceled', 'incomplete', 'trialing');
CREATE TYPE match_status_enum AS ENUM ('upcoming', 'full', 'in_progress', 'completed', 'canceled');
CREATE TYPE application_status_enum AS ENUM ('draft', 'pending', 'approved', 'rejected');
CREATE TYPE payout_status_enum AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE terrain_type_enum AS ENUM ('indoor', 'outdoor', 'covered');
CREATE TYPE registration_status_enum AS ENUM ('confirmed', 'canceled');
CREATE TYPE notification_type_enum AS ENUM (
  'match_created', 'registration_confirmed',
  'registration_canceled', 'match_canceled',
  'match_full', 'subscription_activated',
  'subscription_canceled', 'application_approved',
  'application_rejected', 'payout_completed',
  'match_results_available', 'match_mvp'
);
CREATE TYPE message_type_enum AS ENUM ('text', 'image', 'voice');
CREATE TYPE match_quality_enum AS ENUM ('excellent', 'good', 'average', 'poor');
CREATE TYPE team_enum AS ENUM ('A', 'B');

-- =====================================================
-- TABLES
-- =====================================================

CREATE TABLE profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT,
  first_name        TEXT NOT NULL CHECK (char_length(first_name) BETWEEN 1 AND 50),
  last_name         TEXT NOT NULL CHECK (char_length(last_name) BETWEEN 1 AND 50),
  country           TEXT CHECK (country IS NULL OR char_length(country) <= 100),
  city              TEXT CHECK (city IS NULL OR char_length(city) <= 100),
  origin_country    TEXT CHECK (origin_country IS NULL OR char_length(origin_country) <= 100),
  role              user_role_enum NOT NULL DEFAULT 'player',
  avatar_url        TEXT,
  favorite_club     TEXT CHECK (favorite_club IS NULL OR char_length(favorite_club) <= 100),
  stripe_customer_id TEXT UNIQUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id  TEXT UNIQUE,
  status                  subscription_status_enum NOT NULL DEFAULT 'incomplete',
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_player_subscription UNIQUE (player_id)
);

CREATE TABLE operators (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  bio               TEXT,
  rating            NUMERIC(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_matches     INTEGER NOT NULL DEFAULT 0,
  stripe_account_id TEXT UNIQUE,
  stripe_onboarded  BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE operator_applications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status            application_status_enum NOT NULL DEFAULT 'draft',
  phone             TEXT CHECK (phone IS NULL OR char_length(phone) BETWEEN 8 AND 20),
  city              TEXT CHECK (city IS NULL OR char_length(city) <= 100),
  years_experience  INTEGER CHECK (years_experience IS NULL OR years_experience >= 0),
  description       TEXT,
  certifications    TEXT,
  id_document_url   TEXT,
  cert_document_url TEXT,
  terms_accepted    BOOLEAN NOT NULL DEFAULT false,
  reviewed_by       UUID REFERENCES profiles(id),
  reviewed_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_operator_application UNIQUE (profile_id)
);

CREATE TABLE matches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id       UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  title             TEXT NOT NULL CHECK (char_length(title) BETWEEN 2 AND 200),
  terrain_type      terrain_type_enum NOT NULL DEFAULT 'outdoor',
  date              DATE NOT NULL,
  start_time        TIME NOT NULL,
  duration_minutes  INTEGER NOT NULL DEFAULT 90 CHECK (duration_minutes >= 15 AND duration_minutes <= 480),
  venue_name        TEXT NOT NULL,
  venue_address     TEXT NOT NULL,
  city              TEXT NOT NULL,
  lat               DOUBLE PRECISION CHECK (lat IS NULL OR lat BETWEEN -90 AND 90),
  lng               DOUBLE PRECISION CHECK (lng IS NULL OR lng BETWEEN -180 AND 180),
  capacity          INTEGER NOT NULL DEFAULT 14 CHECK (capacity >= 2),
  registered_count  INTEGER NOT NULL DEFAULT 0 CHECK (registered_count >= 0),
  status            match_status_enum NOT NULL DEFAULT 'upcoming',
  description       TEXT,
  image_url         TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE match_registrations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      registration_status_enum NOT NULL DEFAULT 'confirmed',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_player_per_match UNIQUE (match_id, player_id)
);

CREATE TABLE operator_payouts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id         UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  period_start        DATE NOT NULL,
  period_end          DATE NOT NULL,
  total_registrations INTEGER NOT NULL DEFAULT 0,
  gross_amount        NUMERIC(8,2) NOT NULL DEFAULT 0,
  platform_fee        NUMERIC(8,2) NOT NULL DEFAULT 0,
  net_amount          NUMERIC(8,2) NOT NULL DEFAULT 0,
  status              payout_status_enum NOT NULL DEFAULT 'pending',
  stripe_transfer_id  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       notification_type_enum NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  data       JSONB DEFAULT '{}',
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE match_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            message_type_enum NOT NULL DEFAULT 'text',
  content         TEXT,
  media_url       TEXT,
  media_duration  INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE platform_config (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Match Results & Player Stats ─────────────────────

CREATE TABLE match_results (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id         UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE UNIQUE,
  operator_id      UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
  score_team_a     INTEGER NOT NULL CHECK (score_team_a >= 0),
  score_team_b     INTEGER NOT NULL CHECK (score_team_b >= 0),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 1),
  match_quality    match_quality_enum NOT NULL,
  notes            TEXT,
  submitted_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE match_player_stats (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id     UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team         team_enum,
  goals        INTEGER NOT NULL DEFAULT 0 CHECK (goals >= 0),
  assists      INTEGER NOT NULL DEFAULT 0 CHECK (assists >= 0),
  attended     BOOLEAN NOT NULL DEFAULT true,
  mvp          BOOLEAN NOT NULL DEFAULT false,
  yellow_card  BOOLEAN NOT NULL DEFAULT false,
  red_card     BOOLEAN NOT NULL DEFAULT false,
  rating       SMALLINT CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  CONSTRAINT unique_player_stats_per_match UNIQUE (match_id, user_id)
);

CREATE TABLE player_career_stats (
  user_id            UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_matches      INTEGER NOT NULL DEFAULT 0,
  total_goals        INTEGER NOT NULL DEFAULT 0,
  total_assists      INTEGER NOT NULL DEFAULT 0,
  total_mvp          INTEGER NOT NULL DEFAULT 0,
  total_yellow_cards INTEGER NOT NULL DEFAULT 0,
  total_red_cards    INTEGER NOT NULL DEFAULT 0,
  win_count          INTEGER NOT NULL DEFAULT 0,
  draw_count         INTEGER NOT NULL DEFAULT 0,
  loss_count         INTEGER NOT NULL DEFAULT 0,
  attendance_rate    DECIMAL(5,4) NOT NULL DEFAULT 1.0,
  last_updated       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_profiles_city ON profiles (city);
CREATE INDEX idx_profiles_role ON profiles (role);
CREATE INDEX idx_subscriptions_player ON subscriptions (player_id);
CREATE INDEX idx_subscriptions_status ON subscriptions (status);
CREATE INDEX idx_subscriptions_stripe ON subscriptions (stripe_subscription_id);
CREATE INDEX idx_operators_profile ON operators (profile_id);
CREATE INDEX idx_operator_applications_profile ON operator_applications (profile_id);
CREATE INDEX idx_operator_applications_status ON operator_applications (status);
CREATE INDEX idx_matches_date ON matches (date);
CREATE INDEX idx_matches_status ON matches (status);
CREATE INDEX idx_matches_operator ON matches (operator_id);
CREATE INDEX idx_matches_city ON matches (city);
CREATE INDEX idx_matches_date_status ON matches (date, status);
CREATE INDEX idx_registrations_match ON match_registrations (match_id);
CREATE INDEX idx_registrations_player ON match_registrations (player_id);
CREATE INDEX idx_registrations_match_status ON match_registrations (match_id, status);
CREATE INDEX idx_payouts_operator ON operator_payouts (operator_id);
CREATE INDEX idx_notifications_user ON notifications (user_id, read, created_at DESC);
CREATE INDEX idx_match_messages_match ON match_messages (match_id, created_at);
CREATE INDEX idx_match_messages_sender ON match_messages (sender_id);

CREATE INDEX idx_match_results_match ON match_results (match_id);
CREATE INDEX idx_match_results_operator ON match_results (operator_id);
CREATE INDEX idx_match_player_stats_match ON match_player_stats (match_id);
CREATE INDEX idx_match_player_stats_user ON match_player_stats (user_id);
CREATE UNIQUE INDEX idx_one_mvp_per_match ON match_player_stats (match_id) WHERE mvp = true;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Check if the current user has an active subscription
CREATE OR REPLACE FUNCTION has_active_subscription()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions
    WHERE player_id = auth.uid()
      AND status = 'active'
      AND current_period_end > now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update registered_count on match_registrations changes
CREATE OR REPLACE FUNCTION update_registered_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE matches SET registered_count = registered_count + 1 WHERE id = NEW.match_id;
    -- Auto-set match to full if capacity reached
    UPDATE matches SET status = 'full'
    WHERE id = NEW.match_id AND registered_count >= capacity AND status = 'upcoming';
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status = 'canceled' THEN
    UPDATE matches SET registered_count = GREATEST(registered_count - 1, 0) WHERE id = NEW.match_id;
    -- Reopen if was full
    UPDATE matches SET status = 'upcoming'
    WHERE id = NEW.match_id AND status = 'full' AND registered_count < capacity;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    UPDATE matches SET registered_count = GREATEST(registered_count - 1, 0) WHERE id = OLD.match_id;
    UPDATE matches SET status = 'upcoming'
    WHERE id = OLD.match_id AND status = 'full' AND registered_count < capacity;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recalculate player_career_stats for the affected user
CREATE OR REPLACE FUNCTION update_player_career_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
  ELSE
    target_user_id := NEW.user_id;
  END IF;

  INSERT INTO player_career_stats (
    user_id, total_matches, total_goals, total_assists, total_mvp,
    total_yellow_cards, total_red_cards, win_count, draw_count, loss_count,
    attendance_rate, last_updated
  )
  SELECT
    target_user_id,
    COUNT(*) FILTER (WHERE ps.attended = true),
    COALESCE(SUM(ps.goals) FILTER (WHERE ps.attended = true), 0),
    COALESCE(SUM(ps.assists) FILTER (WHERE ps.attended = true), 0),
    COUNT(*) FILTER (WHERE ps.mvp = true),
    COUNT(*) FILTER (WHERE ps.yellow_card = true),
    COUNT(*) FILTER (WHERE ps.red_card = true),
    COUNT(*) FILTER (WHERE ps.attended = true AND (
      (ps.team = 'A' AND mr.score_team_a > mr.score_team_b) OR
      (ps.team = 'B' AND mr.score_team_b > mr.score_team_a)
    )),
    COUNT(*) FILTER (WHERE ps.attended = true AND mr.score_team_a = mr.score_team_b),
    COUNT(*) FILTER (WHERE ps.attended = true AND (
      (ps.team = 'A' AND mr.score_team_a < mr.score_team_b) OR
      (ps.team = 'B' AND mr.score_team_b < mr.score_team_a)
    )),
    CASE
      WHEN COUNT(*) = 0 THEN 1.0
      ELSE COUNT(*) FILTER (WHERE ps.attended = true)::DECIMAL / COUNT(*)
    END,
    now()
  FROM match_player_stats ps
  JOIN match_results mr ON mr.match_id = ps.match_id
  WHERE ps.user_id = target_user_id
  ON CONFLICT (user_id) DO UPDATE SET
    total_matches = EXCLUDED.total_matches,
    total_goals = EXCLUDED.total_goals,
    total_assists = EXCLUDED.total_assists,
    total_mvp = EXCLUDED.total_mvp,
    total_yellow_cards = EXCLUDED.total_yellow_cards,
    total_red_cards = EXCLUDED.total_red_cards,
    win_count = EXCLUDED.win_count,
    draw_count = EXCLUDED.draw_count,
    loss_count = EXCLUDED.loss_count,
    attendance_rate = EXCLUDED.attendance_rate,
    last_updated = now();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recompute operators.rating from player ratings average
CREATE OR REPLACE FUNCTION update_operator_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_match_id UUID;
  target_operator_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_match_id := OLD.match_id;
  ELSE
    target_match_id := NEW.match_id;
  END IF;

  SELECT m.operator_id INTO target_operator_id
  FROM matches m WHERE m.id = target_match_id;

  IF target_operator_id IS NOT NULL THEN
    UPDATE operators
    SET rating = COALESCE((
      SELECT ROUND(AVG(mps.rating)::numeric, 2)
      FROM match_player_stats mps
      JOIN matches m ON m.id = mps.match_id
      WHERE m.operator_id = target_operator_id
        AND mps.rating IS NOT NULL
    ), 0)
    WHERE id = target_operator_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_operators_updated_at BEFORE UPDATE ON operators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_operator_applications_updated_at BEFORE UPDATE ON operator_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_operator_payouts_updated_at BEFORE UPDATE ON operator_payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_registrations_count_insert
  AFTER INSERT ON match_registrations
  FOR EACH ROW EXECUTE FUNCTION update_registered_count();

CREATE TRIGGER trg_registrations_count_update
  AFTER UPDATE ON match_registrations
  FOR EACH ROW EXECUTE FUNCTION update_registered_count();

CREATE TRIGGER trg_registrations_count_delete
  AFTER DELETE ON match_registrations
  FOR EACH ROW EXECUTE FUNCTION update_registered_count();

CREATE TRIGGER trg_match_results_updated_at BEFORE UPDATE ON match_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_player_stats_career_insert
  AFTER INSERT ON match_player_stats
  FOR EACH ROW EXECUTE FUNCTION update_player_career_stats();

CREATE TRIGGER trg_player_stats_career_update
  AFTER UPDATE ON match_player_stats
  FOR EACH ROW EXECUTE FUNCTION update_player_career_stats();

CREATE TRIGGER trg_player_stats_career_delete
  AFTER DELETE ON match_player_stats
  FOR EACH ROW EXECUTE FUNCTION update_player_career_stats();

CREATE TRIGGER trg_player_stats_operator_rating
  AFTER INSERT OR UPDATE OR DELETE ON match_player_stats
  FOR EACH ROW EXECUTE FUNCTION update_operator_rating();

-- =====================================================
-- TABLE GRANTS (PostgREST roles)
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_career_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;

-- profiles (public read, own write)
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON profiles FOR DELETE USING (auth.uid() = id);

-- subscriptions (own read, service role for write via webhooks)
CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT
  USING (auth.uid() = player_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "subscriptions_insert" ON subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "subscriptions_update" ON subscriptions FOR UPDATE USING (true);

-- operators (public read, own write)
CREATE POLICY "operators_select_all" ON operators FOR SELECT USING (true);
CREATE POLICY "operators_insert_own" ON operators FOR INSERT
  WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "operators_update_own" ON operators FOR UPDATE
  USING (auth.uid() = profile_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- operator_applications (own read + admin read, own insert, admin update)
CREATE POLICY "applications_select" ON operator_applications FOR SELECT
  USING (auth.uid() = profile_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "applications_insert_own" ON operator_applications FOR INSERT
  WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "applications_update" ON operator_applications FOR UPDATE
  USING (auth.uid() = profile_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- matches (public read, operator can create/update own, admin can update any)
CREATE POLICY "matches_select_all" ON matches FOR SELECT USING (true);
CREATE POLICY "matches_insert_operator" ON matches FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM operators WHERE id = operator_id AND profile_id = auth.uid()));
CREATE POLICY "matches_update" ON matches FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM operators WHERE id = operator_id AND profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- match_registrations (public read, subscription-gated insert, own cancel)
CREATE POLICY "registrations_select_all" ON match_registrations FOR SELECT USING (true);
CREATE POLICY "registrations_insert_subscriber" ON match_registrations FOR INSERT
  WITH CHECK (auth.uid() = player_id AND has_active_subscription());
CREATE POLICY "registrations_update_own" ON match_registrations FOR UPDATE
  USING (auth.uid() = player_id);
CREATE POLICY "registrations_delete_own" ON match_registrations FOR DELETE
  USING (auth.uid() = player_id);

-- operator_payouts (operator own read, admin all)
CREATE POLICY "payouts_select" ON operator_payouts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM operators WHERE id = operator_id AND profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "payouts_insert" ON operator_payouts FOR INSERT WITH CHECK (true);
CREATE POLICY "payouts_update" ON operator_payouts FOR UPDATE USING (true);

-- notifications (own only)
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_any" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- match_messages (registered players can read/write, sender can delete own)
CREATE POLICY "messages_select_registered" ON match_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM match_registrations
      WHERE match_id = match_messages.match_id AND player_id = auth.uid() AND status = 'confirmed'
    )
    OR EXISTS (
      SELECT 1 FROM matches m JOIN operators o ON o.id = m.operator_id
      WHERE m.id = match_messages.match_id AND o.profile_id = auth.uid()
    )
  );
CREATE POLICY "messages_insert_registered" ON match_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM match_registrations
      WHERE match_id = match_messages.match_id AND player_id = auth.uid() AND status = 'confirmed'
    )
  );
CREATE POLICY "messages_delete_own" ON match_messages FOR DELETE
  USING (auth.uid() = sender_id);

-- match_results (public read, operator write own)
CREATE POLICY "match_results_select_all" ON match_results FOR SELECT USING (true);
CREATE POLICY "match_results_insert_operator" ON match_results FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM operators WHERE id = operator_id AND profile_id = auth.uid()));
CREATE POLICY "match_results_update_operator" ON match_results FOR UPDATE
  USING (EXISTS (SELECT 1 FROM operators WHERE id = operator_id AND profile_id = auth.uid()));

-- match_player_stats (public read, operator write via match ownership)
CREATE POLICY "match_player_stats_select_all" ON match_player_stats FOR SELECT USING (true);
CREATE POLICY "match_player_stats_insert_operator" ON match_player_stats FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM matches m JOIN operators o ON o.id = m.operator_id
    WHERE m.id = match_id AND o.profile_id = auth.uid()
  ));
CREATE POLICY "match_player_stats_update_operator" ON match_player_stats FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM matches m JOIN operators o ON o.id = m.operator_id
    WHERE m.id = match_id AND o.profile_id = auth.uid()
  ));
CREATE POLICY "match_player_stats_update_own_rating" ON match_player_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- player_career_stats (public read, trigger-managed — no direct write)
CREATE POLICY "player_career_stats_select_all" ON player_career_stats FOR SELECT USING (true);

-- platform_config (public read, admin write)
CREATE POLICY "platform_config_select_all" ON platform_config FOR SELECT USING (true);
CREATE POLICY "platform_config_update_admin" ON platform_config FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "platform_config_insert_admin" ON platform_config FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- =====================================================
-- STORAGE
-- =====================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('match-images', 'match-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-images', 'chat-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-voice-notes', 'chat-voice-notes', true) ON CONFLICT (id) DO NOTHING;

-- avatars: public read, user-scoped write
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- documents: private, user-scoped write, admin read
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Documents are private"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ));

-- match-images: public read, operators can upload
CREATE POLICY "Match images publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'match-images');
CREATE POLICY "Operators can upload match images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'match-images' AND auth.uid() IS NOT NULL);
CREATE POLICY "Operators can delete match images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'match-images' AND auth.uid() IS NOT NULL);

-- chat-images: public read, authenticated upload
CREATE POLICY "Chat images publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'chat-images');
CREATE POLICY "Authenticated users can upload chat images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-images' AND auth.uid() IS NOT NULL);

-- chat-voice-notes: public read, authenticated upload
CREATE POLICY "Chat voice notes publicly accessible"
  ON storage.objects FOR SELECT USING (bucket_id = 'chat-voice-notes');
CREATE POLICY "Authenticated users can upload voice notes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-voice-notes' AND auth.uid() IS NOT NULL);

-- =====================================================
-- SEED platform_config defaults
-- =====================================================

INSERT INTO platform_config (key, value) VALUES
  ('subscription_price', '{"amount": 11.99, "currency": "EUR"}'),
  ('revenue_share_rate', '{"rate": 0.80}'),
  ('min_payout_amount', '{"amount": 10.00, "currency": "EUR"}'),
  ('stripe_price_id', '{"id": ""}');

-- =====================================================
-- REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE match_registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE match_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE match_results;
