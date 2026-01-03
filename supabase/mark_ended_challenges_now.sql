-- Quick fix: Manually mark all ended challenges as pending review
-- Run this NOW to catch the "10 sit ups" challenge and any others that were missed
-- Includes 1 hour grace period to prevent marking active daily challenges

-- Show what will be updated
SELECT 
  id, 
  title, 
  status, 
  approval_status,
  end_date,
  end_date < (NOW() - INTERVAL '1 hour') as has_ended_with_grace,
  NOW() - end_date as time_since_ended
FROM challenges
WHERE end_date < (NOW() - INTERVAL '1 hour')
  AND approval_status IS NULL
  AND status IN ('upcoming', 'active', 'completed')
ORDER BY end_date DESC;

-- Update them to pending review
UPDATE challenges
SET 
  approval_status = 'pending',
  status = 'completed'
WHERE end_date < (NOW() - INTERVAL '1 hour')
  AND approval_status IS NULL
  AND status IN ('upcoming', 'active', 'completed');

-- Show results
SELECT 
  id, 
  title, 
  status, 
  approval_status,
  end_date
FROM challenges
WHERE approval_status = 'pending'
ORDER BY end_date DESC;

