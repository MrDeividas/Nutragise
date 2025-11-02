-- Add onboarding_last_step column to profiles table
-- This tracks which step the user was on when they exited onboarding

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_last_step INTEGER DEFAULT 1;

-- Add comment for clarity
COMMENT ON COLUMN profiles.onboarding_last_step IS 'Tracks the last step number completed during onboarding (1-13). Used to resume onboarding from where user left off.';

