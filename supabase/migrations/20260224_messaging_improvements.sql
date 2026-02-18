-- ============================================================
-- Messaging improvements: unread count fn, notification trigger, soft-delete
-- ============================================================

-- 1. Unread conversation count function
-- Replaces broken PostgREST cross-column filter
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
    AND (cp.last_read_at IS NULL OR cp.last_read_at < c.last_message_at);
$$;

-- 2. Soft-delete column on direct_messages
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Allow sender to soft-delete their own messages
CREATE POLICY "Users can soft-delete own messages"
  ON direct_messages FOR UPDATE
  USING (sender_id = auth.uid())
  WITH CHECK (sender_id = auth.uid());

-- 3. Notification trigger for new direct messages
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
END;
$$;

CREATE TRIGGER trg_notify_direct_message
  AFTER INSERT ON direct_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_direct_message();
