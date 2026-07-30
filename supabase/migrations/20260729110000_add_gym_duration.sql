-- Optional workout duration bucket for gym habit logs
ALTER TABLE public.daily_habits
  ADD COLUMN IF NOT EXISTS gym_duration text;

COMMENT ON COLUMN public.daily_habits.gym_duration IS
  'Optional workout duration bucket, e.g. 0-30 mins, 31-60 mins, 61-90 mins, 120 mins, 120 mins+';
