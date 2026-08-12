-- Manual goal progress for Update Goal bumps (1/3/5/10/20%)
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS progress_percent integer;

ALTER TABLE public.goals
  DROP CONSTRAINT IF EXISTS goals_progress_percent_range;

ALTER TABLE public.goals
  ADD CONSTRAINT goals_progress_percent_range
  CHECK (progress_percent IS NULL OR (progress_percent >= 0 AND progress_percent <= 100));

COMMENT ON COLUMN public.goals.progress_percent IS
  'Manual goal completion 0–100. Null = fall back to check-in/session estimate.';
