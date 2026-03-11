-- Check if core habit challenges exist and their status
SELECT 
  id,
  title,
  status,
  is_recurring,
  recurring_schedule,
  start_date,
  end_date,
  entry_fee,
  created_at,
  CASE 
    WHEN start_date > NOW() THEN '⏩ UPCOMING'
    WHEN end_date < NOW() THEN '⏪ ENDED'
    WHEN start_date <= NOW() AND end_date >= NOW() THEN '✅ ACTIVE'
  END as time_status
FROM challenges
WHERE title IN (
  'Gym Challenge',
  'Exercise Challenge',
  'Goal Update Challenge',
  'Microlearn Challenge',
  'Focus Challenge',
  'Reflection Challenge',
  'Water Challenge',
  'Cold Shower Challenge',
  'Screen Time Challenge',
  'Sleep Challenge',
  'Meditation Challenge'
)
ORDER BY title, start_date DESC;

-- Check how many challenges total exist
SELECT COUNT(*) as total_challenges FROM challenges;

-- Check all active recurring challenges
SELECT 
  id,
  title,
  status,
  is_recurring,
  recurring_schedule,
  start_date,
  end_date
FROM challenges
WHERE is_recurring = true
  AND status = 'active'
ORDER BY title;
