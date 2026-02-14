-- ============================================================
-- Match Recap Posts: link posts to matches
-- ============================================================

-- Add match_id column to posts (one post per match)
ALTER TABLE posts ADD COLUMN match_id UUID REFERENCES matches(id) ON DELETE SET NULL;
CREATE UNIQUE INDEX idx_posts_match_id ON posts (match_id) WHERE match_id IS NOT NULL;

-- RLS: admins can also add/delete media on any post
CREATE POLICY "Admins can add media to any post"
  ON post_media FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete media from any post"
  ON post_media FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Storage: admins can upload to any social-media folder (not scoped by UID)
CREATE POLICY "Admins can upload social media files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'social-media'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
