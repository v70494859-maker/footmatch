-- ============================================================
-- Phase 5: Team Challenges
-- ============================================================

-- Enum
CREATE TYPE challenge_status_enum AS ENUM (
  'proposed', 'accepted', 'declined',
  'scheduled', 'in_progress', 'completed', 'canceled'
);

-- Add notification types for challenges
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'challenge_received';
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'challenge_accepted';
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'challenge_declined';

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE team_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  challenged_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  status challenge_status_enum NOT NULL DEFAULT 'proposed',
  proposed_date TIMESTAMPTZ,
  proposed_venue TEXT,
  match_id UUID REFERENCES matches(id),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT challenges_no_self CHECK (challenger_team_id != challenged_team_id)
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_team_challenges_challenger ON team_challenges (challenger_team_id);
CREATE INDEX idx_team_challenges_challenged ON team_challenges (challenged_team_id);
CREATE INDEX idx_team_challenges_status ON team_challenges (status);
CREATE INDEX idx_team_challenges_match ON team_challenges (match_id) WHERE match_id IS NOT NULL;

-- ============================================================
-- Triggers
-- ============================================================

-- Updated_at trigger (reuse existing update_updated_at from init)
CREATE TRIGGER trg_team_challenges_updated_at
  BEFORE UPDATE ON team_challenges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE team_challenges ENABLE ROW LEVEL SECURITY;

-- Members of both teams can read challenges
CREATE POLICY "Team members can view challenges"
  ON team_challenges FOR SELECT
  USING (
    is_team_member(auth.uid(), challenger_team_id)
    OR is_team_member(auth.uid(), challenged_team_id)
  );

-- Captains of challenger team can insert
CREATE POLICY "Challenger captains can create challenges"
  ON team_challenges FOR INSERT
  WITH CHECK (
    is_team_captain(auth.uid(), challenger_team_id)
  );

-- Captains of challenged team can update (accept/decline)
CREATE POLICY "Challenged captains can respond to challenges"
  ON team_challenges FOR UPDATE
  USING (
    is_team_captain(auth.uid(), challenged_team_id)
    OR is_team_captain(auth.uid(), challenger_team_id)
  );

-- ============================================================
-- Grants
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON team_challenges TO authenticated;

-- ============================================================
-- Realtime
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE team_challenges;
