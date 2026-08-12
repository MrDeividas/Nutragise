-- Backfill missing schedule requirements so Schedule tab can show correct activity counts.
-- Gym Warrior: 3 sessions/week. 10K Steps Daily: every day (7/week).

INSERT INTO public.challenge_requirements (
  challenge_id,
  requirement_text,
  frequency,
  target_count,
  requirement_order
)
SELECT
  c.id,
  'Post a photo proving your gym session — at least 3 days out of 7 required to pass.',
  'weekly',
  3,
  1
FROM public.challenges c
WHERE c.title = 'Gym Warrior'
  AND NOT EXISTS (
    SELECT 1 FROM public.challenge_requirements r WHERE r.challenge_id = c.id
  );

INSERT INTO public.challenge_requirements (
  challenge_id,
  requirement_text,
  frequency,
  target_count,
  requirement_order
)
SELECT
  c.id,
  'Walk 10,000 steps every day — 7 days required to pass.',
  'daily',
  7,
  1
FROM public.challenges c
WHERE c.title IN ('10K Steps Daily', '10k Steps Daily', '10K Steps', '10k Steps')
  AND NOT EXISTS (
    SELECT 1 FROM public.challenge_requirements r WHERE r.challenge_id = c.id
  );

-- Clarify N-of-7 copy for core habits (keep frequency daily so per-day submission limits stay intact).
UPDATE public.challenge_requirements r
SET requirement_text = CASE
  WHEN c.title = 'Gym' THEN 'Complete gym workout — at least 5 days out of 7 required to pass.'
  WHEN c.title = 'Exercise' THEN 'Complete run or exercise — at least 3 days out of 7 required to pass.'
  WHEN c.title = 'Goal Update' THEN 'Update goal — at least 5 days out of 7 required to pass.'
  ELSE r.requirement_text
END
FROM public.challenges c
WHERE r.challenge_id = c.id
  AND c.title IN ('Gym', 'Exercise', 'Goal Update')
  AND COALESCE(c.is_user_created, false) = false;
