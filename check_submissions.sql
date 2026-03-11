-- Check what submissions exist for this challenge
SELECT 
  id,
  user_id,
  challenge_id,
  week_number,
  submitted_at,
  photo_url,
  verification_status,
  created_at
FROM challenge_submissions
WHERE challenge_id = 'e8742f40-5978-42b3-bcdb-f3700f341968'
  AND user_id = '5207606a-c01f-4450-84cd-4a6a3ae982aa'
ORDER BY submitted_at DESC;

-- Check if there are multiple submissions
SELECT 
  COUNT(*) as total_submissions,
  COUNT(DISTINCT week_number) as distinct_weeks,
  MIN(submitted_at) as first_submission,
  MAX(submitted_at) as last_submission
FROM challenge_submissions
WHERE challenge_id = 'e8742f40-5978-42b3-bcdb-f3700f341968'
  AND user_id = '5207606a-c01f-4450-84cd-4a6a3ae982aa';
