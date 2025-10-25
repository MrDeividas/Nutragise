-- Add stats_visible column to profiles table
-- This column controls whether a user's progression stats are visible on their public profile

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stats_visible BOOLEAN DEFAULT true;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.stats_visible IS 'Controls visibility of progression stats on public profile (default: true)';

-- Update existing rows to have stats_visible = true by default
UPDATE profiles 
SET stats_visible = true 
WHERE stats_visible IS NULL;

