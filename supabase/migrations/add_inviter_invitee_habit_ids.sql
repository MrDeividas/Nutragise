-- Add separate habit ID columns for inviter and invitee
-- This allows both users to track their own copy of a custom habit

ALTER TABLE habit_accountability_partners
ADD COLUMN IF NOT EXISTS inviter_habit_id UUID,
ADD COLUMN IF NOT EXISTS invitee_habit_id UUID;

-- For existing partnerships, copy custom_habit_id to inviter_habit_id
UPDATE habit_accountability_partners
SET inviter_habit_id = custom_habit_id
WHERE habit_type = 'custom' AND inviter_habit_id IS NULL;

-- Add comment
COMMENT ON COLUMN habit_accountability_partners.inviter_habit_id IS 'The inviter''s custom habit ID (for custom habits where each user has their own copy)';
COMMENT ON COLUMN habit_accountability_partners.invitee_habit_id IS 'The invitee''s custom habit ID (for custom habits where each user has their own copy)';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_habit_partners_inviter_habit ON habit_accountability_partners(inviter_habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_partners_invitee_habit ON habit_accountability_partners(invitee_habit_id);

