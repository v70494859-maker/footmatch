-- ============================================================
-- Phase 4: Social Feed (Posts, Likes, Comments)
-- ============================================================

-- Enums
CREATE TYPE post_visibility_enum AS ENUM ('public', 'friends', 'team');
CREATE TYPE post_media_type_enum AS ENUM ('image', 'video');

-- Add notification types for social feed
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'post_liked';
ALTER TYPE notification_type_enum ADD VALUE IF NOT EXISTS 'post_commented';

-- ============================================================
-- Tables
-- ============================================================

-- Posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  caption TEXT,
  visibility post_visibility_enum NOT NULL DEFAULT 'public',
  team_id UUID REFERENCES teams(id),
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Post media (images/videos attached to a post)
CREATE TABLE post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  media_type post_media_type_enum NOT NULL,
  media_url TEXT NOT NULL,
  thumbnail_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Post likes
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT post_likes_unique UNIQUE (post_id, user_id)
);

-- Post comments
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_posts_author ON posts (author_id);
CREATE INDEX idx_posts_visibility ON posts (visibility);
CREATE INDEX idx_posts_team ON posts (team_id) WHERE team_id IS NOT NULL;
CREATE INDEX idx_posts_created_at ON posts (created_at DESC);
CREATE INDEX idx_post_media_post ON post_media (post_id, sort_order);
CREATE INDEX idx_post_likes_post ON post_likes (post_id);
CREATE INDEX idx_post_likes_user ON post_likes (user_id);
CREATE INDEX idx_post_comments_post ON post_comments (post_id, created_at);
CREATE INDEX idx_post_comments_author ON post_comments (author_id);

-- ============================================================
-- Storage: social-media bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('social-media', 'social-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Social media files are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'social-media');

-- Authenticated user-scoped upload
CREATE POLICY "Users can upload social media files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'social-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own uploads
CREATE POLICY "Users can update own social media files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'social-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own uploads
CREATE POLICY "Users can delete own social media files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'social-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- Triggers
-- ============================================================

-- Update like_count on post_likes INSERT/DELETE
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_post_likes_count_insert
  AFTER INSERT ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

CREATE TRIGGER trg_post_likes_count_delete
  AFTER DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

-- Update comment_count on post_comments INSERT/DELETE
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_post_comments_count_insert
  AFTER INSERT ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

CREATE TRIGGER trg_post_comments_count_delete
  AFTER DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Updated_at trigger on posts (reuse existing update_updated_at from init)
CREATE TRIGGER trg_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- posts: visibility-based read, author can CRUD own
CREATE POLICY "Authenticated users can read public posts"
  ON posts FOR SELECT
  USING (
    -- Author can always see own posts
    auth.uid() = author_id
    -- Public posts: any authenticated user
    OR (visibility = 'public' AND auth.uid() IS NOT NULL)
    -- Friends posts: only if friends with author
    OR (visibility = 'friends' AND are_friends(auth.uid(), author_id))
    -- Team posts: only if member of the team
    OR (visibility = 'team' AND team_id IS NOT NULL AND is_team_member(auth.uid(), team_id))
  );

CREATE POLICY "Authors can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = author_id);

-- post_media: same visibility as parent post, author can insert/delete
CREATE POLICY "Users can view post media"
  ON post_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_media.post_id
        AND (
          auth.uid() = p.author_id
          OR (p.visibility = 'public' AND auth.uid() IS NOT NULL)
          OR (p.visibility = 'friends' AND are_friends(auth.uid(), p.author_id))
          OR (p.visibility = 'team' AND p.team_id IS NOT NULL AND is_team_member(auth.uid(), p.team_id))
        )
    )
  );

CREATE POLICY "Authors can add post media"
  ON post_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_media.post_id AND p.author_id = auth.uid()
    )
  );

CREATE POLICY "Authors can delete post media"
  ON post_media FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_media.post_id AND p.author_id = auth.uid()
    )
  );

-- post_likes: authenticated can read, user can insert/delete own
CREATE POLICY "Authenticated users can view likes"
  ON post_likes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can like posts"
  ON post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- post_comments: authenticated can read, user can insert own, author can delete own
CREATE POLICY "Authenticated users can view comments"
  ON post_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can add comments"
  ON post_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own comments"
  ON post_comments FOR DELETE
  USING (auth.uid() = author_id);

-- ============================================================
-- Grants
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON post_media TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON post_likes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON post_comments TO authenticated;

-- ============================================================
-- Realtime
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE post_comments;
