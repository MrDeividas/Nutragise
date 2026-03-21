-- Track workout weight goal history for each user
CREATE TABLE IF NOT EXISTS workout_weight_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_weight DECIMAL(5,2),
  target_weight DECIMAL(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workout_weight_history_user_created
  ON workout_weight_history(user_id, created_at DESC);

ALTER TABLE workout_weight_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own workout weight history" ON workout_weight_history;
CREATE POLICY "Users can read own workout weight history"
  ON workout_weight_history
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own workout weight history" ON workout_weight_history;
CREATE POLICY "Users can insert own workout weight history"
  ON workout_weight_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own workout weight history" ON workout_weight_history;
CREATE POLICY "Users can delete own workout weight history"
  ON workout_weight_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
