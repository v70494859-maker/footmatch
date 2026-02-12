-- ============================================================
-- Phase 1: Friends System
-- ============================================================

-- Enum for friendship status
CREATE TYPE friendship_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'blocked');

-- Friendships table
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status friendship_status_enum NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT friendships_no_self CHECK (requester_id != addressee_id),
  CONSTRAINT friendships_unique_pair UNIQUE (requester_id, addressee_id)
);

-- Indexes
CREATE INDEX idx_friendships_requester_status ON friendships (requester_id, status);
CREATE INDEX idx_friendships_addressee_status ON friendships (addressee_id, status);

-- Helper function: check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(user_a UUID, user_b UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
      AND (
        (requester_id = user_a AND addressee_id = user_b)
        OR (requester_id = user_b AND addressee_id = user_a)
      )
  );
$$;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_friendships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_friendships_updated_at();

-- Add new notification types for friends
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'friend_request';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'friend_accepted';

-- RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Users can see friendships they are part of
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id AND status = 'pending');

-- Users can update friendships they are part of
CREATE POLICY "Users can update own friendships"
  ON friendships FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can delete friendships they are part of
CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON friendships TO authenticated;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
