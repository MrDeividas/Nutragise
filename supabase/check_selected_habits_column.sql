-- Test script to check if selected_daily_habits column exists
-- Run this in Supabase SQL editor to check

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'selected_daily_habits';
