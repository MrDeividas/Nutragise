-- Pillars must never sit below the starting floor of 35%
UPDATE public.pillar_progress
SET progress_percentage = 35,
    updated_at = now()
WHERE progress_percentage < 35;

ALTER TABLE public.pillar_progress
  DROP CONSTRAINT IF EXISTS pillar_progress_percentage_min_check;

ALTER TABLE public.pillar_progress
  ADD CONSTRAINT pillar_progress_percentage_min_check
  CHECK (progress_percentage >= 35 AND progress_percentage <= 100);
