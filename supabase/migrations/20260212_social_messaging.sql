-- ============================================================
-- Phase 3: Direct Messaging System
-- ============================================================

-- Enums
CREATE TYPE conversation_type_enum AS ENUM ('direct', 'group');
CREATE TYPE direct_message_type_enum AS ENUM ('text', 'image', 'voice');

-- Add notification type for messaging
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'new_message';

-- ============================================================
-- Tables
-- ============================================================

-- Conversations (direct or group)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type conversation_type_enum NOT NULL DEFAULT 'direct',
  name TEXT,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Conversation participants
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  last_read_at TIMESTAMPTZ,
  muted BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT conversation_participants_unique UNIQUE (conversation_id, user_id)
);

-- Direct messages
CREATE TABLE direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id),
  type direct_message_type_enum NOT NULL DEFAULT 'text',
  content TEXT,
  media_url TEXT,
  reply_to_id UUID REFERENCES direct_messages(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_conversations_last_message ON conversations (last_message_at DESC);
CREATE INDEX idx_conversation_participants_user ON conversation_participants (user_id);
CREATE INDEX idx_conversation_participants_conversation ON conversation_participants (conversation_id);
CREATE INDEX idx_direct_messages_conversation ON direct_messages (conversation_id, created_at DESC);
CREATE INDEX idx_direct_messages_sender ON direct_messages (sender_id);
CREATE INDEX idx_direct_messages_reply ON direct_messages (reply_to_id) WHERE reply_to_id IS NOT NULL;

-- ============================================================
-- Functions
-- ============================================================

-- Get or create a direct conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(user_a UUID, user_b UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conv_id UUID;
BEGIN
  -- Try to find an existing direct conversation between the two users
  SELECT cp1.conversation_id INTO conv_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  JOIN conversations c
    ON c.id = cp1.conversation_id
  WHERE c.type = 'direct'
    AND cp1.user_id = user_a
    AND cp2.user_id = user_b;

  -- If found, return it
  IF conv_id IS NOT NULL THEN
    RETURN conv_id;
  END IF;

  -- Otherwise, create a new direct conversation
  INSERT INTO conversations (type)
  VALUES ('direct')
  RETURNING id INTO conv_id;

  -- Add both participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES
    (conv_id, user_a),
    (conv_id, user_b);

  RETURN conv_id;
END;
$$;

-- ============================================================
-- Triggers
-- ============================================================

-- Update conversation.last_message_at when a new message is inserted
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_direct_messages_last_message
  AFTER INSERT ON direct_messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- conversations: participants can read
CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- conversation_participants: participants can read, user can update own (muted, last_read_at)
CREATE POLICY "Participants can view conversation members"
  ON conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
        AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can be added to conversations"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own participant settings"
  ON conversation_participants FOR UPDATE
  USING (auth.uid() = user_id);

-- direct_messages: participants can read, sender can insert
CREATE POLICY "Participants can view messages"
  ON direct_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = direct_messages.conversation_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON direct_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = direct_messages.conversation_id
        AND user_id = auth.uid()
    )
  );

-- ============================================================
-- Grants
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON direct_messages TO authenticated;

-- ============================================================
-- Realtime
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
