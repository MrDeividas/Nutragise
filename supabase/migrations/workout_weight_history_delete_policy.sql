-- Allow users to delete their own workout weight history rows (Remove in app)
DROP POLICY IF EXISTS "Users can delete own workout weight history" ON public.workout_weight_history;

CREATE POLICY "Users can delete own workout weight history"
  ON public.workout_weight_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
