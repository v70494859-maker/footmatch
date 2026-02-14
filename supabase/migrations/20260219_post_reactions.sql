-- Reaction types enum
CREATE TYPE post_reaction_type_enum AS ENUM ('like', 'fire', 'goal', 'clap', 'laugh');

-- Post reactions table
CREATE TABLE post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type post_reaction_type_enum NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT post_reactions_unique UNIQUE (post_id, user_id)
);

-- Indexes
CREATE INDEX idx_post_reactions_post ON post_reactions (post_id);
CREATE INDEX idx_post_reactions_user ON post_reactions (user_id);
CREATE INDEX idx_post_reactions_type ON post_reactions (post_id, reaction_type);

-- Migrate existing likes to reactions
INSERT INTO post_reactions (post_id, user_id, reaction_type, created_at)
SELECT post_id, user_id, 'like', created_at
FROM post_likes
ON CONFLICT DO NOTHING;

-- Trigger: update posts.like_count on reaction insert/delete (reuse column name)
CREATE OR REPLACE FUNCTION update_post_reaction_count()
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

CREATE TRIGGER trg_post_reactions_count_insert
  AFTER INSERT ON post_reactions
  FOR EACH ROW EXECUTE FUNCTION update_post_reaction_count();

CREATE TRIGGER trg_post_reactions_count_delete
  AFTER DELETE ON post_reactions
  FOR EACH ROW EXECUTE FUNCTION update_post_reaction_count();

-- RLS
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view reactions"
  ON post_reactions FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can react to posts"
  ON post_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their reactions"
  ON post_reactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions"
  ON post_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON post_reactions TO authenticated;
