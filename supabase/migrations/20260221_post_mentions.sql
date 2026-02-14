-- Post mentions (tracks @mentions in posts and comments)
CREATE TABLE post_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentioner_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mention_target_check CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
);

-- Indexes
CREATE INDEX idx_post_mentions_post ON post_mentions (post_id) WHERE post_id IS NOT NULL;
CREATE INDEX idx_post_mentions_comment ON post_mentions (comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX idx_post_mentions_mentioned ON post_mentions (mentioned_user_id, created_at DESC);
CREATE INDEX idx_post_mentions_mentioner ON post_mentions (mentioner_user_id);

-- RLS
ALTER TABLE post_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view mentions"
  ON post_mentions FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create mentions"
  ON post_mentions FOR INSERT WITH CHECK (auth.uid() = mentioner_user_id);

-- Grants
GRANT SELECT, INSERT ON post_mentions TO authenticated;
