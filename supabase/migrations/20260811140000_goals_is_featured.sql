-- Featured goals for Profile circles (max 3 active per user, enforced in app)
ALTER TABLE public.goals
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.goals.is_featured IS
  'When true, goal can appear in the Profile featured goal circles (max 3 per user).';

CREATE INDEX IF NOT EXISTS goals_user_featured_idx
  ON public.goals (user_id)
  WHERE is_featured = true AND completed = false;
