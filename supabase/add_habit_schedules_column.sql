-- Add habit_schedules column to profiles table
-- This column stores weekly schedules for each habit as JSONB
-- Format: {"habitId": [Sun, Mon, Tue, Wed, Thu, Fri, Sat]}

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS habit_schedules JSONB DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN profiles.habit_schedules IS 'Weekly schedules for habits. Format: {"habitId": [boolean array for Sun-Sat]}';

-- Create index for better performance on JSONB queries
CREATE INDEX IF NOT EXISTS idx_profiles_habit_schedules 
ON profiles USING GIN (habit_schedules);
