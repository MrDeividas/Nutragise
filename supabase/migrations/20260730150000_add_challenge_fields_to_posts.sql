-- Link community posts to challenges when shared from challenge proof
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS challenge_id uuid REFERENCES public.challenges(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS challenge_title text;

CREATE INDEX IF NOT EXISTS posts_challenge_id_idx ON public.posts (challenge_id)
  WHERE challenge_id IS NOT NULL;

COMMENT ON COLUMN public.posts.challenge_id IS
  'Optional challenge this post was shared from (proof photo shared to community feed).';

COMMENT ON COLUMN public.posts.challenge_title IS
  'Snapshot of challenge display title at share time for feed label.';
