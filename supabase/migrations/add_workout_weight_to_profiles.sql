-- Add optional body weight fields for My Workout section.
-- Run in Supabase → SQL Editor (same project as your app URL).
-- If you still see PGRST204 after this, run the NOTIFY line again or wait ~1 min.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS workout_current_weight DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS workout_target_weight DECIMAL(5,2);

-- Refresh PostgREST schema cache so the API sees the new columns immediately
NOTIFY pgrst, 'reload schema';
