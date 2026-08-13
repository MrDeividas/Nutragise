-- 15K Steps Daily starts on Sundays (12 days)
UPDATE public.challenges
SET
  start_date = '2026-08-16 00:01:00+00',
  end_date = '2026-08-27 23:59:59+00',
  description = 'Hit 15,000 steps every day for 12 days. Starts Sundays. Open to everyone.',
  status = CASE
    WHEN status IN ('active', 'upcoming') THEN 'upcoming'
    ELSE status
  END
WHERE coalesce(is_user_created, false) = false
  AND status IN ('active', 'upcoming')
  AND lower(regexp_replace(trim(title), '\s+', ' ', 'g')) LIKE '15k steps%';
