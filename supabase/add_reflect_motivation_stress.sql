-- Add motivation and stress columns to daily_habits table and update RPC
-- Run this in Supabase SQL Editor

-- 1. Add new columns to daily_habits table
ALTER TABLE daily_habits 
ADD COLUMN IF NOT EXISTS reflect_motivation INTEGER CHECK (reflect_motivation BETWEEN 1 AND 5),
ADD COLUMN IF NOT EXISTS reflect_stress INTEGER CHECK (reflect_stress BETWEEN 1 AND 5);

COMMENT ON COLUMN daily_habits.reflect_motivation IS 'User motivation level (1-5) from reflect habit';
COMMENT ON COLUMN daily_habits.reflect_stress IS 'User stress level (1-5) from reflect habit';

-- 2. Update the upsert_daily_habits RPC function to include new parameters
CREATE OR REPLACE FUNCTION upsert_daily_habits(
  p_user_id UUID,
  p_date DATE,
  p_sleep_hours NUMERIC DEFAULT NULL,
  p_sleep_quality INTEGER DEFAULT NULL,
  p_sleep_notes TEXT DEFAULT NULL,
  p_water_intake INTEGER DEFAULT NULL,
  p_meditation_minutes INTEGER DEFAULT NULL,
  p_mood_score INTEGER DEFAULT NULL,
  p_mood_notes TEXT DEFAULT NULL,
  p_gratitude_notes TEXT DEFAULT NULL,
  p_run_distance NUMERIC DEFAULT NULL,
  p_run_duration NUMERIC DEFAULT NULL,
  p_run_notes TEXT DEFAULT NULL,
  p_gym_day_type TEXT DEFAULT NULL,
  p_gym_training_types TEXT[] DEFAULT NULL,
  p_gym_custom_type TEXT DEFAULT NULL,
  p_reflect_mood INTEGER DEFAULT NULL,
  p_reflect_energy INTEGER DEFAULT NULL,
  p_reflect_what_went_well TEXT DEFAULT NULL,
  p_reflect_friction TEXT DEFAULT NULL,
  p_reflect_one_tweak TEXT DEFAULT NULL,
  p_reflect_nothing_to_change BOOLEAN DEFAULT NULL,
  p_cold_shower_completed BOOLEAN DEFAULT NULL,
  p_reflect_motivation INTEGER DEFAULT NULL,
  p_reflect_stress INTEGER DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO daily_habits (
    user_id,
    date,
    sleep_hours,
    sleep_quality,
    sleep_notes,
    water_intake,
    meditation_minutes,
    mood_score,
    mood_notes,
    gratitude_notes,
    run_distance,
    run_duration,
    run_notes,
    gym_day_type,
    gym_training_types,
    gym_custom_type,
    reflect_mood,
    reflect_energy,
    reflect_what_went_well,
    reflect_friction,
    reflect_one_tweak,
    reflect_nothing_to_change,
    cold_shower_completed,
    reflect_motivation,
    reflect_stress,
    updated_at
  )
  VALUES (
    p_user_id,
    p_date,
    p_sleep_hours,
    p_sleep_quality,
    p_sleep_notes,
    p_water_intake,
    p_meditation_minutes,
    p_mood_score,
    p_mood_notes,
    p_gratitude_notes,
    p_run_distance,
    p_run_duration,
    p_run_notes,
    p_gym_day_type,
    p_gym_training_types,
    p_gym_custom_type,
    p_reflect_mood,
    p_reflect_energy,
    p_reflect_what_went_well,
    p_reflect_friction,
    p_reflect_one_tweak,
    p_reflect_nothing_to_change,
    p_cold_shower_completed,
    p_reflect_motivation,
    p_reflect_stress,
    NOW()
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    sleep_hours = COALESCE(p_sleep_hours, daily_habits.sleep_hours),
    sleep_quality = COALESCE(p_sleep_quality, daily_habits.sleep_quality),
    sleep_notes = COALESCE(p_sleep_notes, daily_habits.sleep_notes),
    water_intake = COALESCE(p_water_intake, daily_habits.water_intake),
    meditation_minutes = COALESCE(p_meditation_minutes, daily_habits.meditation_minutes),
    mood_score = COALESCE(p_mood_score, daily_habits.mood_score),
    mood_notes = COALESCE(p_mood_notes, daily_habits.mood_notes),
    gratitude_notes = COALESCE(p_gratitude_notes, daily_habits.gratitude_notes),
    run_distance = COALESCE(p_run_distance, daily_habits.run_distance),
    run_duration = COALESCE(p_run_duration, daily_habits.run_duration),
    run_notes = COALESCE(p_run_notes, daily_habits.run_notes),
    gym_day_type = COALESCE(p_gym_day_type, daily_habits.gym_day_type),
    gym_training_types = COALESCE(p_gym_training_types, daily_habits.gym_training_types),
    gym_custom_type = COALESCE(p_gym_custom_type, daily_habits.gym_custom_type),
    reflect_mood = COALESCE(p_reflect_mood, daily_habits.reflect_mood),
    reflect_energy = COALESCE(p_reflect_energy, daily_habits.reflect_energy),
    reflect_what_went_well = COALESCE(p_reflect_what_went_well, daily_habits.reflect_what_went_well),
    reflect_friction = COALESCE(p_reflect_friction, daily_habits.reflect_friction),
    reflect_one_tweak = COALESCE(p_reflect_one_tweak, daily_habits.reflect_one_tweak),
    reflect_nothing_to_change = COALESCE(p_reflect_nothing_to_change, daily_habits.reflect_nothing_to_change),
    cold_shower_completed = COALESCE(p_cold_shower_completed, daily_habits.cold_shower_completed),
    reflect_motivation = COALESCE(p_reflect_motivation, daily_habits.reflect_motivation),
    reflect_stress = COALESCE(p_reflect_stress, daily_habits.reflect_stress),
    updated_at = NOW();
END;
$$;

