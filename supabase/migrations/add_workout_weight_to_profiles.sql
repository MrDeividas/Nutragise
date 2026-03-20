-- Add optional body weight fields for My Workout section
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS workout_current_weight DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS workout_target_weight DECIMAL(5,2);
