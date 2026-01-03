-- Add habit_snapshot column to store habit details at invite time
-- This ensures that even if the inviter deletes their habit, the invitee can still create it

ALTER TABLE habit_accountability_partners
ADD COLUMN IF NOT EXISTS habit_snapshot JSONB;

-- Add comment
COMMENT ON COLUMN habit_accountability_partners.habit_snapshot IS 'Stores habit details (title, schedule, etc.) at invite time, so invitee can create habit even if inviter deletes theirs';

-- Create index for JSONB queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_habit_partners_snapshot ON habit_accountability_partners USING GIN (habit_snapshot);

