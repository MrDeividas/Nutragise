-- Check if Daily Smile Challenge is set as recurring
SELECT 
  id,
  title,
  is_recurring,
  recurring_schedule,
  start_date,
  end_date,
  status,
  entry_fee
FROM challenges
WHERE title ILIKE '%smile%'
ORDER BY created_at DESC
LIMIT 5;

