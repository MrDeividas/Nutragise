-- Create tables to persist custom habits created from the Action screen
-- Run this script inside the Supabase SQL editor

-- 1) Core habits table
CREATE TABLE IF NOT EXISTS custom_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  preset_key TEXT,
  category TEXT NOT NULL CHECK (category IN ('custom', 'wellbeing', 'nutrition', 'time', 'avoid')),
  habit_mode TEXT NOT NULL CHECK (habit_mode IN ('positive', 'negative', 'timed')),
  description TEXT,
  accent_color TEXT,
  icon_name TEXT,
  schedule_type TEXT NOT NULL CHECK (
    schedule_type IN (
      'specific_days_week',
      'specific_days_month',
      'days_per_week',
      'days_per_fortnight',
      'days_per_month',
      'every_x_days'
    )
  ),
  days_of_week SMALLINT[],          -- 0 (Mon) ... 6 (Sun)
  days_of_month SMALLINT[],         -- 1..31
  quantity_per_week SMALLINT,
  quantity_per_fortnight SMALLINT,
  quantity_per_month SMALLINT,
  every_x_days SMALLINT CHECK (every_x_days IS NULL OR every_x_days >= 2),
  start_date DATE DEFAULT CURRENT_DATE,
  timezone TEXT DEFAULT 'UTC',
  goal_duration_minutes INTEGER CHECK (goal_duration_minutes IS NULL OR goal_duration_minutes > 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE custom_habits IS 'Stores user-created habits from the Action screen modal.';

CREATE INDEX IF NOT EXISTS idx_custom_habits_user ON custom_habits(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_habits_user_category ON custom_habits(user_id, category);

ALTER TABLE custom_habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom habits"
  ON custom_habits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom habits"
  ON custom_habits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom habits"
  ON custom_habits
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom habits"
  ON custom_habits
  FOR DELETE
  USING (auth.uid() = user_id);

-- 2) Habit completion log
CREATE TABLE IF NOT EXISTS custom_habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES custom_habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  occur_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'skipped', 'missed')),
  value NUMERIC,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(habit_id, occur_date)
);

COMMENT ON TABLE custom_habit_completions IS 'Tracks per-day completion status for custom habits.';

CREATE INDEX IF NOT EXISTS idx_custom_habit_completions_user_date
  ON custom_habit_completions(user_id, occur_date);
CREATE INDEX IF NOT EXISTS idx_custom_habit_completions_habit
  ON custom_habit_completions(habit_id, occur_date);

ALTER TABLE custom_habit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own custom habit completions"
  ON custom_habit_completions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom habit completions"
  ON custom_habit_completions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom habit completions"
  ON custom_habit_completions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom habit completions"
  ON custom_habit_completions
  FOR DELETE
  USING (auth.uid() = user_id);

