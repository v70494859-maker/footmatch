-- Post polls
CREATE TABLE post_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE UNIQUE,
  question TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Poll options
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES post_polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  vote_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Poll votes
CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES post_polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT poll_votes_unique UNIQUE (poll_id, user_id)
);

-- Indexes
CREATE INDEX idx_post_polls_post ON post_polls (post_id);
CREATE INDEX idx_poll_options_poll ON poll_options (poll_id, sort_order);
CREATE INDEX idx_poll_votes_poll ON poll_votes (poll_id);
CREATE INDEX idx_poll_votes_user ON poll_votes (user_id);

-- Trigger: Update vote_count on poll_options
CREATE OR REPLACE FUNCTION update_poll_option_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE poll_options SET vote_count = vote_count + 1 WHERE id = NEW.option_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE poll_options SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.option_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_poll_votes_count
  AFTER INSERT OR DELETE ON poll_votes
  FOR EACH ROW EXECUTE FUNCTION update_poll_option_vote_count();

-- RLS
ALTER TABLE post_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view polls"
  ON post_polls FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create polls on their posts"
  ON post_polls FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM posts WHERE id = post_id AND author_id = auth.uid()));

CREATE POLICY "Authenticated users can view poll options"
  ON poll_options FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create poll options"
  ON poll_options FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM post_polls pp JOIN posts p ON p.id = pp.post_id
    WHERE pp.id = poll_id AND p.author_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can view votes"
  ON poll_votes FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can vote"
  ON poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their vote"
  ON poll_votes FOR DELETE USING (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT ON post_polls TO authenticated;
GRANT SELECT, INSERT ON poll_options TO authenticated;
GRANT SELECT, INSERT, DELETE ON poll_votes TO authenticated;
