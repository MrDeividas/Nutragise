-- Add community flagging to challenge submissions
-- Participants (and other users) can flag a submission → only flagged challenges go to admin review

-- Add flag tracking columns to the existing challenge_submissions table
ALTER TABLE challenge_submissions
  ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS flag_count  INT     NOT NULL DEFAULT 0;

-- Table to record individual flags (one per user per submission)
CREATE TABLE IF NOT EXISTS challenge_submission_flags (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID        NOT NULL REFERENCES challenge_submissions(id) ON DELETE CASCADE,
  flagged_by    UUID        NOT NULL REFERENCES profiles(id)             ON DELETE CASCADE,
  reason        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(submission_id, flagged_by)
);

-- Index for fast lookup of all flags on a submission
CREATE INDEX IF NOT EXISTS idx_csf_submission_id ON challenge_submission_flags(submission_id);
-- Index so we can quickly find every flag made by a specific user
CREATE INDEX IF NOT EXISTS idx_csf_flagged_by    ON challenge_submission_flags(flagged_by);

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE challenge_submission_flags ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read flags (needed to show flag count / "already flagged" state)
CREATE POLICY "flags_select_authenticated"
  ON challenge_submission_flags FOR SELECT
  TO authenticated
  USING (true);

-- Users can flag any submission that is NOT their own
CREATE POLICY "flags_insert_not_own"
  ON challenge_submission_flags FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = flagged_by
    AND auth.uid() != (
      SELECT user_id FROM challenge_submissions WHERE id = submission_id
    )
  );

-- Users can only delete their own flag
CREATE POLICY "flags_delete_own"
  ON challenge_submission_flags FOR DELETE
  TO authenticated
  USING (auth.uid() = flagged_by);

-- ── RPC helpers for flag counter updates ─────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_submission_flag_count(submission_id_param UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE challenge_submissions
  SET
    flag_count = flag_count + 1,
    is_flagged  = TRUE
  WHERE id = submission_id_param;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_submission_flag_count(submission_id_param UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE challenge_submissions
  SET
    flag_count = GREATEST(flag_count - 1, 0),
    is_flagged  = CASE WHEN flag_count - 1 <= 0 THEN FALSE ELSE TRUE END
  WHERE id = submission_id_param;
END;
$$;
