-- Update existing column to use correct default habits
-- Run this in Supabase SQL editor

-- First, update any existing NULL values to the correct default
UPDATE profiles 
SET selected_daily_habits = ARRAY['gym', 'reflect', 'focus', 'sleep', 'water', 'run', 'microlearn', 'cold_shower']
WHERE selected_daily_habits IS NULL;

-- Then update the column default for future inserts
ALTER TABLE profiles 
ALTER COLUMN selected_daily_habits SET DEFAULT ARRAY['gym', 'reflect', 'focus', 'sleep', 'water', 'run', 'microlearn', 'cold_shower'];
