-- Add focus habit fields to daily_habits table
ALTER TABLE daily_habits 
ADD COLUMN IF NOT EXISTS focus_duration INTEGER,
ADD COLUMN IF NOT EXISTS focus_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS focus_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS focus_notes TEXT,
ADD COLUMN IF NOT EXISTS focus_completed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN daily_habits.focus_duration IS 'Focus session duration in minutes';
COMMENT ON COLUMN daily_habits.focus_start_time IS 'Focus session start timestamp';
COMMENT ON COLUMN daily_habits.focus_end_time IS 'Focus session end timestamp';
COMMENT ON COLUMN daily_habits.focus_notes IS 'Optional notes about the focus session';
COMMENT ON COLUMN daily_habits.focus_completed IS 'Whether the focus session was completed successfully';

-- Update the upsert_daily_habits RPC function to include focus parameters
CREATE OR REPLACE FUNCTION upsert_daily_habits(
  p_user_id UUID,
  p_date DATE,
  p_sleep_hours INTEGER DEFAULT NULL,
  p_sleep_quality INTEGER DEFAULT NULL,
  p_sleep_notes TEXT DEFAULT NULL,
  p_sleep_bedtime_hours INTEGER DEFAULT NULL,
  p_sleep_bedtime_minutes INTEGER DEFAULT NULL,
  p_sleep_wakeup_hours INTEGER DEFAULT NULL,
  p_sleep_wakeup_minutes INTEGER DEFAULT NULL,
  p_water_intake INTEGER DEFAULT NULL,
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
  p_cold_shower_completed BOOLEAN DEFAULT NULL,
  p_focus_duration INTEGER DEFAULT NULL,
  p_focus_start_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_focus_end_time TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_focus_notes TEXT DEFAULT NULL,
  p_focus_completed BOOLEAN DEFAULT NULL
)
RETURNS daily_habits AS $$
DECLARE
  result daily_habits;
BEGIN
  INSERT INTO daily_habits (
    user_id,
    date,
    sleep_hours,
    sleep_quality,
    sleep_notes,
    sleep_bedtime_hours,
    sleep_bedtime_minutes,
    sleep_wakeup_hours,
    sleep_wakeup_minutes,
    water_intake,
    water_goal,
    water_notes,
    run_day_type,
    run_type,
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
    focus_duration,
    focus_start_time,
    focus_end_time,
    focus_notes,
    focus_completed
  )
  VALUES (
    p_user_id,
    p_date,
    p_sleep_hours,
    p_sleep_quality,
    p_sleep_notes,
    p_sleep_bedtime_hours,
    p_sleep_bedtime_minutes,
    p_sleep_wakeup_hours,
    p_sleep_wakeup_minutes,
    p_water_intake,
    p_water_goal,
    p_water_notes,
    p_run_day_type,
    p_run_type,
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
    p_focus_duration,
    p_focus_start_time,
    p_focus_end_time,
    p_focus_notes,
    p_focus_completed
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    sleep_hours = COALESCE(EXCLUDED.sleep_hours, daily_habits.sleep_hours),
    sleep_quality = COALESCE(EXCLUDED.sleep_quality, daily_habits.sleep_quality),
    sleep_notes = COALESCE(EXCLUDED.sleep_notes, daily_habits.sleep_notes),
    sleep_bedtime_hours = COALESCE(EXCLUDED.sleep_bedtime_hours, daily_habits.sleep_bedtime_hours),
    sleep_bedtime_minutes = COALESCE(EXCLUDED.sleep_bedtime_minutes, daily_habits.sleep_bedtime_minutes),
    sleep_wakeup_hours = COALESCE(EXCLUDED.sleep_wakeup_hours, daily_habits.sleep_wakeup_hours),
    sleep_wakeup_minutes = COALESCE(EXCLUDED.sleep_wakeup_minutes, daily_habits.sleep_wakeup_minutes),
    water_intake = COALESCE(EXCLUDED.water_intake, daily_habits.water_intake),
    water_goal = COALESCE(EXCLUDED.water_goal, daily_habits.water_goal),
    water_notes = COALESCE(EXCLUDED.water_notes, daily_habits.water_notes),
    run_day_type = COALESCE(EXCLUDED.run_day_type, daily_habits.run_day_type),
    run_type = COALESCE(EXCLUDED.run_type, daily_habits.run_type),
    run_distance = COALESCE(EXCLUDED.run_distance, daily_habits.run_distance),
    run_duration = COALESCE(EXCLUDED.run_duration, daily_habits.run_duration),
    run_notes = COALESCE(EXCLUDED.run_notes, daily_habits.run_notes),
    gym_day_type = COALESCE(EXCLUDED.gym_day_type, daily_habits.gym_day_type),
    gym_training_types = COALESCE(EXCLUDED.gym_training_types, daily_habits.gym_training_types),
    gym_custom_type = COALESCE(EXCLUDED.gym_custom_type, daily_habits.gym_custom_type),
    reflect_mood = COALESCE(EXCLUDED.reflect_mood, daily_habits.reflect_mood),
    reflect_energy = COALESCE(EXCLUDED.reflect_energy, daily_habits.reflect_energy),
    reflect_what_went_well = COALESCE(EXCLUDED.reflect_what_went_well, daily_habits.reflect_what_went_well),
    reflect_friction = COALESCE(EXCLUDED.reflect_friction, daily_habits.reflect_friction),
    reflect_one_tweak = COALESCE(EXCLUDED.reflect_one_tweak, daily_habits.reflect_one_tweak),
    reflect_nothing_to_change = COALESCE(EXCLUDED.reflect_nothing_to_change, daily_habits.reflect_nothing_to_change),
    cold_shower_completed = COALESCE(EXCLUDED.cold_shower_completed, daily_habits.cold_shower_completed),
    focus_duration = COALESCE(EXCLUDED.focus_duration, daily_habits.focus_duration),
    focus_start_time = COALESCE(EXCLUDED.focus_start_time, daily_habits.focus_start_time),
    focus_end_time = COALESCE(EXCLUDED.focus_end_time, daily_habits.focus_end_time),
    focus_notes = COALESCE(EXCLUDED.focus_notes, daily_habits.focus_notes),
    focus_completed = COALESCE(EXCLUDED.focus_completed, daily_habits.focus_completed),
    updated_at = NOW()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
