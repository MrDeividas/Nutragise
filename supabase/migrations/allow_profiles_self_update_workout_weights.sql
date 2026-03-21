-- Fix "Save failed" when updating workout weight fields from the app.
-- Usually caused by missing UPDATE policy on `profiles` or missing columns.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS workout_current_weight DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS workout_target_weight DECIMAL(5,2);

-- Ensure RLS is on (no-op if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Let each signed-in user update only their own profile row.
-- Name is unique so this migration is safe to re-run after DROP.
DROP POLICY IF EXISTS "profiles_authenticated_update_own_row" ON public.profiles;

CREATE POLICY "profiles_authenticated_update_own_row"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
