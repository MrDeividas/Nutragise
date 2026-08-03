-- Store linked goal/milestone metadata on community feed posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS milestone_title text,
  ADD COLUMN IF NOT EXISTS goal_title text;
