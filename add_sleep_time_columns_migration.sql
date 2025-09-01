-- Add sleep time columns to daily_habits table
-- This migration adds the bedtime and wake time fields to support detailed sleep tracking

-- Add the new columns to the daily_habits table
ALTER TABLE daily_habits 
ADD COLUMN IF NOT EXISTS sleep_bedtime_hours INTEGER,
ADD COLUMN IF NOT EXISTS sleep_bedtime_minutes INTEGER,
ADD COLUMN IF NOT EXISTS sleep_wakeup_hours INTEGER,
ADD COLUMN IF NOT EXISTS sleep_wakeup_minutes INTEGER;

-- Update the upsert_daily_habits function to include the new sleep time parameters
CREATE OR REPLACE FUNCTION upsert_daily_habits(
  p_user_id UUID,
  p_date DATE,
  p_sleep_hours NUMERIC DEFAULT NULL,
  p_sleep_quality INTEGER DEFAULT NULL,
  p_sleep_bedtime_hours INTEGER DEFAULT NULL,
  p_sleep_bedtime_minutes INTEGER DEFAULT NULL,
  p_sleep_wakeup_hours INTEGER DEFAULT NULL,
  p_sleep_wakeup_minutes INTEGER DEFAULT NULL,
  p_sleep_notes TEXT DEFAULT NULL,
  p_water_intake NUMERIC DEFAULT NULL,
  p_water_goal TEXT DEFAULT NULL,
  p_water_notes TEXT DEFAULT NULL,
  p_run_day_type TEXT DEFAULT NULL,
  p_run_type TEXT DEFAULT NULL,
  p_run_distance NUMERIC DEFAULT NULL,
  p_run_duration TEXT DEFAULT NULL,
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
  p_cold_shower_completed BOOLEAN DEFAULT NULL
) RETURNS daily_habits AS $$
BEGIN
  INSERT INTO daily_habits (
    user_id, date, 
    sleep_hours, sleep_quality, sleep_bedtime_hours, sleep_bedtime_minutes,
    sleep_wakeup_hours, sleep_wakeup_minutes, sleep_notes,
    water_intake, water_goal, water_notes,
    run_day_type, run_type, run_distance, run_duration, run_notes,
    gym_day_type, gym_training_types, gym_custom_type,
    reflect_mood, reflect_energy, reflect_what_went_well, 
    reflect_friction, reflect_one_tweak, reflect_nothing_to_change,
    cold_shower_completed,
    created_at, updated_at
  ) VALUES (
    p_user_id, p_date,
    p_sleep_hours, p_sleep_quality, p_sleep_bedtime_hours, p_sleep_bedtime_minutes,
    p_sleep_wakeup_hours, p_sleep_wakeup_minutes, p_sleep_notes,
    p_water_intake, p_water_goal, p_water_notes,
    p_run_day_type, p_run_type, p_run_distance, p_run_duration, p_run_notes,
    p_gym_day_type, p_gym_training_types, p_gym_custom_type,
    p_reflect_mood, p_reflect_energy, p_reflect_what_went_well,
    p_reflect_friction, p_reflect_one_tweak, p_reflect_nothing_to_change,
    p_cold_shower_completed,
    NOW(), NOW()
  )
  ON CONFLICT (user_id, date) DO UPDATE SET
    sleep_hours = EXCLUDED.sleep_hours,
    sleep_quality = EXCLUDED.sleep_quality,
    sleep_bedtime_hours = EXCLUDED.sleep_bedtime_hours,
    sleep_bedtime_minutes = EXCLUDED.sleep_bedtime_minutes,
    sleep_wakeup_hours = EXCLUDED.sleep_wakeup_hours,
    sleep_wakeup_minutes = EXCLUDED.sleep_wakeup_minutes,
    sleep_notes = EXCLUDED.sleep_notes,
    water_intake = EXCLUDED.water_intake,
    water_goal = EXCLUDED.water_goal,
    water_notes = EXCLUDED.water_notes,
    run_day_type = EXCLUDED.run_day_type,
    run_type = EXCLUDED.run_type,
    run_distance = EXCLUDED.run_distance,
    run_duration = EXCLUDED.run_duration,
    run_notes = EXCLUDED.run_notes,
    gym_day_type = EXCLUDED.gym_day_type,
    gym_training_types = EXCLUDED.gym_training_types,
    gym_custom_type = EXCLUDED.gym_custom_type,
    reflect_mood = EXCLUDED.reflect_mood,
    reflect_energy = EXCLUDED.reflect_energy,
    reflect_what_went_well = EXCLUDED.reflect_what_went_well,
    reflect_friction = EXCLUDED.reflect_friction,
    reflect_one_tweak = EXCLUDED.reflect_one_tweak,
    reflect_nothing_to_change = EXCLUDED.reflect_nothing_to_change,
    cold_shower_completed = EXCLUDED.cold_shower_completed,
    updated_at = NOW()
  RETURNING *;
END;
$$ LANGUAGE plpgsql;
