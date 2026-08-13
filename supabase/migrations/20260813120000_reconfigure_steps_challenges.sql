-- Steps section: replace Free Gym Warrior / free 10k / pro 15k with paid everyone step ladder
-- 8K Mon 12d £40 | 10K Wed 15d £35 | 12K Fri 10d £30 | 15K Mon 12d £30 (everyone)

UPDATE public.challenges
SET status = 'cancelled'
WHERE coalesce(is_user_created, false) = false
  AND status IN ('active', 'upcoming')
  AND (
    lower(trim(title)) IN ('gym warrior', 'gym warrior free', 'free gym warrior')
    OR lower(regexp_replace(trim(title), '\s+', ' ', 'g')) LIKE '8k steps%'
    OR lower(regexp_replace(trim(title), '\s+', ' ', 'g')) LIKE '10k steps%'
    OR lower(regexp_replace(trim(title), '\s+', ' ', 'g')) LIKE '12k steps%'
    OR lower(regexp_replace(trim(title), '\s+', ' ', 'g')) LIKE '15k steps%'
  );

-- Inserts applied remotely via MCP (see apply_migration reconfigure_steps_challenges_section)
