-- Create workout_exercise_logs table to track exercise-specific data per completion
CREATE TABLE IF NOT EXISTS workout_exercise_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completion_id UUID NOT NULL REFERENCES workout_completions(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  weight NUMERIC,
  sets INTEGER,
  reps INTEGER,
  goal_weight NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_workout_exercise_logs_user_id ON workout_exercise_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercise_logs_completion_id ON workout_exercise_logs(completion_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercise_logs_exercise_name ON workout_exercise_logs(user_id, exercise_name);

-- Enable RLS
ALTER TABLE workout_exercise_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own exercise logs
CREATE POLICY "Users can view their own exercise logs"
  ON workout_exercise_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own exercise logs
CREATE POLICY "Users can insert their own exercise logs"
  ON workout_exercise_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own exercise logs
CREATE POLICY "Users can update their own exercise logs"
  ON workout_exercise_logs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own exercise logs
CREATE POLICY "Users can delete their own exercise logs"
  ON workout_exercise_logs FOR DELETE
  USING (auth.uid() = user_id);

