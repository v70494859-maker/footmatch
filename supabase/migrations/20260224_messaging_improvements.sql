-- ============================================================
-- Messaging improvements: RLS fix, unread count fn, notification trigger, soft-delete, media_duration
-- ============================================================

-- 0. Fix infinite recursion in conversation_participants SELECT policy
-- Create a SECURITY DEFINER helper to break the recursion cycle
CREATE OR REPLACE FUNCTION is_conversation_participant(conv_id UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conv_id AND user_id = uid
  )
$$;

-- Replace the recursive policy with one using the helper function
DROP POLICY IF EXISTS "Participants can view conversation members" ON conversation_participants;
CREATE POLICY "Participants can view conversation members"
  ON conversation_participants FOR SELECT
  USING (is_conversation_participant(conversation_id, auth.uid()));

-- Also fix conversations and direct_messages policies to use the helper
DROP POLICY IF EXISTS "Participants can view conversations" ON conversations;
CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT
  USING (is_conversation_participant(id, auth.uid()));

DROP POLICY IF EXISTS "Participants can view messages" ON direct_messages;
CREATE POLICY "Participants can view messages"
  ON direct_messages FOR SELECT
  USING (is_conversation_participant(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Participants can send messages" ON direct_messages;
CREATE POLICY "Participants can send messages"
  ON direct_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND is_conversation_participant(conversation_id, auth.uid())
  );

-- 1. Add missing media_duration column for voice messages
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS media_duration INTEGER;

-- 2. Soft-delete column on direct_messages
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 3. Allow sender to soft-delete their own messages
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Users can soft-delete own messages' AND tablename = 'direct_messages'
  ) THEN
    CREATE POLICY "Users can soft-delete own messages"
      ON direct_messages FOR UPDATE
      USING (sender_id = auth.uid())
      WITH CHECK (sender_id = auth.uid());
  END IF;
END $$;

-- 4. Unread conversation count function
CREATE OR REPLACE FUNCTION get_unread_conversation_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::INTEGER
  FROM conversation_participants cp
  JOIN conversations c ON c.id = cp.conversation_id
  WHERE cp.user_id = p_user_id
    AND c.last_message_at IS NOT NULL
    AND (cp.last_read_at IS NULL OR cp.last_read_at < c.last_message_at)
$$;

-- 5. Notification trigger for new direct messages
CREATE OR REPLACE FUNCTION notify_new_direct_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  SELECT
    cp.user_id,
    'new_message',
    sender.first_name || ' ' || sender.last_name,
    CASE
      WHEN NEW.type = 'text' THEN LEFT(NEW.content, 100)
      WHEN NEW.type = 'image' THEN 'Photo'
      ELSE 'Audio'
    END,
    jsonb_build_object('conversationId', NEW.conversation_id)
  FROM conversation_participants cp
  JOIN profiles sender ON sender.id = NEW.sender_id
  WHERE cp.conversation_id = NEW.conversation_id
    AND cp.user_id != NEW.sender_id
    AND cp.muted = false;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_notify_direct_message ON direct_messages;
CREATE TRIGGER trg_notify_direct_message
  AFTER INSERT ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_direct_message();
