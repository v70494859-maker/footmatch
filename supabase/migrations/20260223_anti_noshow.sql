-- =====================================================
-- Anti No-Show System Migration
-- =====================================================

-- 1a. New columns on player_career_stats
ALTER TABLE player_career_stats
  ADD COLUMN IF NOT EXISTS no_show_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS late_cancel_count INTEGER NOT NULL DEFAULT 0;

-- 1b. Track when cancellations happen
ALTER TABLE match_registrations
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

-- 1c. Cancellation tokens on profiles (1 per month)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS cancel_tokens INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS cancel_tokens_reset_at TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()) + INTERVAL '1 month';

-- 1d. Add standby status + position
ALTER TYPE registration_status_enum ADD VALUE IF NOT EXISTS 'standby';

ALTER TABLE match_registrations
  ADD COLUMN IF NOT EXISTS standby_position INTEGER;

-- =====================================================
-- Updated trigger: update_registered_count()
-- Now handles standby promotion when a confirmed player cancels
-- =====================================================
CREATE OR REPLACE FUNCTION update_registered_count()
RETURNS TRIGGER AS $$
DECLARE
  match_cap INTEGER;
  current_count INTEGER;
  standby_count INTEGER;
  first_standby_id UUID;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE matches SET registered_count = registered_count + 1 WHERE id = NEW.match_id;
    -- Auto-set match to full if capacity reached
    UPDATE matches SET status = 'full'
    WHERE id = NEW.match_id AND registered_count >= capacity AND status = 'upcoming';

  ELSIF TG_OP = 'INSERT' AND NEW.status = 'standby' THEN
    -- Standby doesn't change registered_count (only confirmed players count)
    NULL;

  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status = 'canceled' THEN
    -- Set canceled_at timestamp
    NEW.canceled_at = now();

    UPDATE matches SET registered_count = GREATEST(registered_count - 1, 0) WHERE id = NEW.match_id;

    -- Promote first standby player if any
    SELECT id INTO first_standby_id
    FROM match_registrations
    WHERE match_id = NEW.match_id AND status = 'standby'
    ORDER BY standby_position ASC NULLS LAST, created_at ASC
    LIMIT 1;

    IF first_standby_id IS NOT NULL THEN
      UPDATE match_registrations
      SET status = 'confirmed', standby_position = NULL
      WHERE id = first_standby_id;
      -- The recursive trigger will handle incrementing registered_count
    ELSE
      -- Reopen if was full and no standby to promote
      UPDATE matches SET status = 'upcoming'
      WHERE id = NEW.match_id AND status = 'full' AND registered_count < capacity;
    END IF;

  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'standby' AND NEW.status = 'canceled' THEN
    -- Standby canceled: just remove, reorder remaining standby positions
    NEW.canceled_at = now();

    UPDATE match_registrations
    SET standby_position = standby_position - 1
    WHERE match_id = NEW.match_id
      AND status = 'standby'
      AND standby_position > OLD.standby_position;

  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'standby' AND NEW.status = 'confirmed' THEN
    -- Standby promoted to confirmed
    UPDATE matches SET registered_count = registered_count + 1 WHERE id = NEW.match_id;
    UPDATE matches SET status = 'full'
    WHERE id = NEW.match_id AND registered_count >= capacity AND status = 'upcoming';

    -- Reorder remaining standby positions
    UPDATE match_registrations
    SET standby_position = standby_position - 1
    WHERE match_id = NEW.match_id
      AND status = 'standby'
      AND id != NEW.id
      AND standby_position > COALESCE(OLD.standby_position, 0);

  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    UPDATE matches SET registered_count = GREATEST(registered_count - 1, 0) WHERE id = OLD.match_id;
    UPDATE matches SET status = 'upcoming'
    WHERE id = OLD.match_id AND status = 'full' AND registered_count < capacity;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Updated trigger: update_player_career_stats()
-- Now includes no_show_count and late_cancel_count
-- =====================================================
CREATE OR REPLACE FUNCTION update_player_career_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_user_id UUID;
  v_late_cancel_count INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
  ELSE
    target_user_id := NEW.user_id;
  END IF;

  -- Count late cancellations (canceled within 24h of match start)
  SELECT COUNT(*) INTO v_late_cancel_count
  FROM match_registrations mr
  JOIN matches m ON m.id = mr.match_id
  WHERE mr.player_id = target_user_id
    AND mr.status = 'canceled'
    AND mr.canceled_at IS NOT NULL
    AND mr.canceled_at > (m.date + m.start_time - INTERVAL '24 hours');

  INSERT INTO player_career_stats (
    user_id, total_matches, total_goals, total_assists, total_mvp,
    total_yellow_cards, total_red_cards, win_count, draw_count, loss_count,
    attendance_rate, no_show_count, late_cancel_count, last_updated
  )
  SELECT
    target_user_id,
    COUNT(*) FILTER (WHERE ps.attended = true),
    COALESCE(SUM(ps.goals) FILTER (WHERE ps.attended = true), 0),
    COALESCE(SUM(ps.assists) FILTER (WHERE ps.attended = true), 0),
    COUNT(*) FILTER (WHERE ps.mvp = true),
    COUNT(*) FILTER (WHERE ps.yellow_card = true),
    COUNT(*) FILTER (WHERE ps.red_card = true),
    COUNT(*) FILTER (WHERE ps.attended = true AND (
      (ps.team = 'A' AND mr.score_team_a > mr.score_team_b) OR
      (ps.team = 'B' AND mr.score_team_b > mr.score_team_a)
    )),
    COUNT(*) FILTER (WHERE ps.attended = true AND mr.score_team_a = mr.score_team_b),
    COUNT(*) FILTER (WHERE ps.attended = true AND (
      (ps.team = 'A' AND mr.score_team_a < mr.score_team_b) OR
      (ps.team = 'B' AND mr.score_team_b < mr.score_team_a)
    )),
    CASE
      WHEN COUNT(*) = 0 THEN 1.0
      ELSE COUNT(*) FILTER (WHERE ps.attended = true)::DECIMAL / COUNT(*)
    END,
    COUNT(*) FILTER (WHERE ps.attended = false),
    v_late_cancel_count,
    now()
  FROM match_player_stats ps
  JOIN match_results mr ON mr.match_id = ps.match_id
  WHERE ps.user_id = target_user_id
  ON CONFLICT (user_id) DO UPDATE SET
    total_matches = EXCLUDED.total_matches,
    total_goals = EXCLUDED.total_goals,
    total_assists = EXCLUDED.total_assists,
    total_mvp = EXCLUDED.total_mvp,
    total_yellow_cards = EXCLUDED.total_yellow_cards,
    total_red_cards = EXCLUDED.total_red_cards,
    win_count = EXCLUDED.win_count,
    draw_count = EXCLUDED.draw_count,
    loss_count = EXCLUDED.loss_count,
    attendance_rate = EXCLUDED.attendance_rate,
    no_show_count = EXCLUDED.no_show_count,
    late_cancel_count = EXCLUDED.late_cancel_count,
    last_updated = now();

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper: reset cancel tokens monthly
-- Called from app code before checking tokens
-- =====================================================
CREATE OR REPLACE FUNCTION reset_cancel_tokens_if_needed(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_tokens INTEGER;
BEGIN
  UPDATE profiles
  SET cancel_tokens = 1,
      cancel_tokens_reset_at = date_trunc('month', now()) + INTERVAL '1 month'
  WHERE id = p_user_id
    AND cancel_tokens_reset_at <= now();

  SELECT cancel_tokens INTO v_tokens FROM profiles WHERE id = p_user_id;
  RETURN v_tokens;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper: use a cancel token
-- Returns true if token was used, false if none available
-- =====================================================
CREATE OR REPLACE FUNCTION use_cancel_token(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tokens INTEGER;
BEGIN
  -- Reset if needed first
  PERFORM reset_cancel_tokens_if_needed(p_user_id);

  SELECT cancel_tokens INTO v_tokens FROM profiles WHERE id = p_user_id;

  IF v_tokens > 0 THEN
    UPDATE profiles SET cancel_tokens = cancel_tokens - 1 WHERE id = p_user_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS policies for new functions
-- =====================================================
GRANT EXECUTE ON FUNCTION reset_cancel_tokens_if_needed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION use_cancel_token(UUID) TO authenticated;
