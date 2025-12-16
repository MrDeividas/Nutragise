-- Fix completed challenges that have 100% completion but status is still 'active'
-- This fixes the bug where status wasn't updated to 'completed' when reaching 100%

-- 1. Update all challenge participants who have 100% completion to 'completed' status
UPDATE challenge_participants
SET status = 'completed'
WHERE completion_percentage >= 100
  AND status != 'completed';

-- 2. Show which challenges were affected
SELECT 
  c.title,
  c.id as challenge_id,
  cp.user_id,
  cp.completion_percentage,
  cp.status,
  c.end_date
FROM challenge_participants cp
JOIN challenges c ON c.id = cp.challenge_id
WHERE cp.completion_percentage >= 100
  AND cp.status = 'completed'
  AND c.end_date < NOW()
ORDER BY c.end_date DESC;

-- 3. Now check which pots need to be distributed
-- (These are challenges that ended with active pots)
SELECT 
  c.title,
  c.id as challenge_id,
  c.end_date,
  pot.status as pot_status,
  pot.total_amount,
  COUNT(cp.user_id) as total_participants,
  COUNT(CASE WHEN cp.completion_percentage >= 100 AND cp.status = 'completed' THEN 1 END) as completed_participants
FROM challenges c
JOIN challenge_pots pot ON pot.challenge_id = c.id
LEFT JOIN challenge_participants cp ON cp.challenge_id = c.id
WHERE c.end_date < NOW()
  AND pot.status = 'active'
GROUP BY c.id, c.title, c.end_date, pot.status, pot.total_amount
ORDER BY c.end_date DESC;

