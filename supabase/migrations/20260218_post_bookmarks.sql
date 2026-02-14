-- Post bookmarks table
CREATE TABLE post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT post_bookmarks_unique UNIQUE (post_id, user_id)
);

-- Indexes
CREATE INDEX idx_post_bookmarks_user ON post_bookmarks (user_id, created_at DESC);
CREATE INDEX idx_post_bookmarks_post ON post_bookmarks (post_id);

-- RLS
ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON post_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can bookmark posts"
  ON post_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unbookmark posts"
  ON post_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT, DELETE ON post_bookmarks TO authenticated;
