-- Allow multiple submissions across different days for recurring challenges
-- Change unique constraint from (challenge_id, user_id, week_number) 
-- to (challenge_id, user_id, submission_date) to allow one submission per day
-- This enables tracking separate submissions for each day of a challenge
-- (e.g., 7 separate submissions for a 7-day challenge, one per day)

-- Step 1: Drop the existing unique constraint
ALTER TABLE challenge_submissions 
DROP CONSTRAINT IF EXISTS challenge_submissions_challenge_id_user_id_week_number_key;

-- Step 2: Add a submission_date column (DATE) for easier tracking
ALTER TABLE challenge_submissions
ADD COLUMN IF NOT EXISTS submission_date DATE;

-- Step 3: Populate submission_date from submitted_at for existing records
UPDATE challenge_submissions
SET submission_date = DATE(submitted_at)
WHERE submission_date IS NULL;

-- Step 4: Set submission_date to NOT NULL (after populating)
ALTER TABLE challenge_submissions
ALTER COLUMN submission_date SET NOT NULL;

-- Step 5: Create a unique constraint on (challenge_id, user_id, submission_date)
-- This allows one submission per day per user per challenge
CREATE UNIQUE INDEX IF NOT EXISTS challenge_submissions_unique_daily
ON challenge_submissions(challenge_id, user_id, submission_date);

-- Step 6: Create a trigger to automatically set submission_date from submitted_at
CREATE OR REPLACE FUNCTION set_submission_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.submission_date IS NULL THEN
    NEW.submission_date := DATE(NEW.submitted_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_submission_date ON challenge_submissions;
CREATE TRIGGER trigger_set_submission_date
  BEFORE INSERT OR UPDATE ON challenge_submissions
  FOR EACH ROW
  EXECUTE FUNCTION set_submission_date();

-- Step 7: Add index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_submission_date 
ON challenge_submissions(submission_date);

-- Step 8: Add index for efficient queries by challenge and user
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_challenge_user_date
ON challenge_submissions(challenge_id, user_id, submission_date);
