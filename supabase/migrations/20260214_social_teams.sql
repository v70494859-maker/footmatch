-- ============================================================
-- Phase 2: Teams System
-- ============================================================

-- Enums
CREATE TYPE team_role_enum AS ENUM ('captain', 'co_captain', 'member');
CREATE TYPE team_invitation_status_enum AS ENUM ('pending', 'accepted', 'rejected');

-- Add notification types for teams
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'team_invite';
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'team_joined';

-- ============================================================
-- Tables
-- ============================================================

-- Team charters: users must sign before creating/joining a team
CREATE TABLE team_charters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT team_charters_unique_user UNIQUE (user_id)
);

-- Teams
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  description TEXT,
  crest_url TEXT,
  crest_preset TEXT,
  captain_id UUID REFERENCES profiles(id),
  city TEXT,
  member_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Team members
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role team_role_enum NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT team_members_unique_pair UNIQUE (team_id, user_id)
);

-- Team invitations
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES profiles(id),
  invitee_id UUID NOT NULL REFERENCES profiles(id),
  status team_invitation_status_enum NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_teams_captain ON teams (captain_id);
CREATE INDEX idx_teams_city ON teams (city);
CREATE INDEX idx_team_members_team ON team_members (team_id);
CREATE INDEX idx_team_members_user ON team_members (user_id);
CREATE INDEX idx_team_invitations_team ON team_invitations (team_id);
CREATE INDEX idx_team_invitations_invitee ON team_invitations (invitee_id, status);
CREATE INDEX idx_team_invitations_inviter ON team_invitations (inviter_id);

-- ============================================================
-- Functions
-- ============================================================

-- Check if a user is a member of a team
CREATE OR REPLACE FUNCTION is_team_member(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = p_user_id AND team_id = p_team_id
  );
$$;

-- Check if a user is captain (or co-captain) of a team
CREATE OR REPLACE FUNCTION is_team_captain(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE user_id = p_user_id
      AND team_id = p_team_id
      AND role IN ('captain', 'co_captain')
  );
$$;

-- Check if a user has signed the team charter
CREATE OR REPLACE FUNCTION has_signed_charter(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_charters
    WHERE user_id = p_user_id
  );
$$;

-- ============================================================
-- Triggers
-- ============================================================

-- Update member_count on team_members INSERT/DELETE
CREATE OR REPLACE FUNCTION update_team_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE teams SET member_count = (
      SELECT COUNT(*) FROM team_members WHERE team_id = NEW.team_id
    ) WHERE id = NEW.team_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE teams SET member_count = (
      SELECT COUNT(*) FROM team_members WHERE team_id = OLD.team_id
    ) WHERE id = OLD.team_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_team_members_count_insert
  AFTER INSERT ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_team_member_count();

CREATE TRIGGER trg_team_members_count_delete
  AFTER DELETE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_team_member_count();

-- Updated_at triggers (reuse existing update_updated_at from init)
CREATE TRIGGER trg_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_team_invitations_updated_at
  BEFORE UPDATE ON team_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Storage: team-crests bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('team-crests', 'team-crests', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Team crests are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'team-crests');

-- Authenticated users can upload team crests
CREATE POLICY "Authenticated users can upload team crests"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'team-crests' AND auth.uid() IS NOT NULL);

-- Authenticated users can update their team crests
CREATE POLICY "Authenticated users can update team crests"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'team-crests' AND auth.uid() IS NOT NULL);

-- Authenticated users can delete team crests
CREATE POLICY "Authenticated users can delete team crests"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'team-crests' AND auth.uid() IS NOT NULL);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE team_charters ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- team_charters: user can read/insert own
CREATE POLICY "Users can view own charter"
  ON team_charters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can sign charter"
  ON team_charters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- teams: public read, captain can update/delete
CREATE POLICY "Teams are publicly readable"
  ON teams FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create a team"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Captain can update team"
  ON teams FOR UPDATE
  USING (is_team_captain(auth.uid(), id));

CREATE POLICY "Captain can delete team"
  ON teams FOR DELETE
  USING (is_team_captain(auth.uid(), id));

-- team_members: public read, captains can insert/delete
CREATE POLICY "Team members are publicly readable"
  ON team_members FOR SELECT
  USING (true);

CREATE POLICY "Captains can add team members"
  ON team_members FOR INSERT
  WITH CHECK (
    is_team_captain(auth.uid(), team_id)
    OR auth.uid() = user_id  -- allow self-insert when accepting invite
  );

CREATE POLICY "Captains can remove team members"
  ON team_members FOR DELETE
  USING (
    is_team_captain(auth.uid(), team_id)
    OR auth.uid() = user_id  -- members can leave
  );

CREATE POLICY "Captains can update team member roles"
  ON team_members FOR UPDATE
  USING (is_team_captain(auth.uid(), team_id));

-- team_invitations: parties can read, captain can insert, invitee can update
CREATE POLICY "Parties can view team invitations"
  ON team_invitations FOR SELECT
  USING (
    auth.uid() = inviter_id
    OR auth.uid() = invitee_id
    OR is_team_captain(auth.uid(), team_id)
  );

CREATE POLICY "Captains can send team invitations"
  ON team_invitations FOR INSERT
  WITH CHECK (
    auth.uid() = inviter_id
    AND is_team_captain(auth.uid(), team_id)
  );

CREATE POLICY "Invitee can respond to team invitation"
  ON team_invitations FOR UPDATE
  USING (auth.uid() = invitee_id);

CREATE POLICY "Captains can delete team invitations"
  ON team_invitations FOR DELETE
  USING (is_team_captain(auth.uid(), team_id));

-- ============================================================
-- Grants
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON team_charters TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_invitations TO authenticated;

-- ============================================================
-- Realtime
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE team_invitations;
