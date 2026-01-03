-- DELETE duplicate Daily Smile Challenge instances
-- This will keep only the most recent challenge per day/entry_fee combination
-- ⚠️ WARNING: This will permanently delete duplicate challenges and their related data
-- ⚠️ Make sure to backup your database before running this!

-- First, let's see what will be deleted:
SELECT 
  id,
  title,
  start_date,
  entry_fee,
  created_at,
  ROW_NUMBER() OVER (
    PARTITION BY title, DATE(start_date), entry_fee 
    ORDER BY created_at DESC
  ) as duplicate_rank
FROM challenges
WHERE title LIKE '%Daily Smile Challenge%'
  AND is_recurring = true
ORDER BY start_date DESC, entry_fee, created_at DESC;

-- If the above looks correct, run this DELETE statement:
-- (It will delete all duplicates, keeping only rank 1 - the most recent)

WITH duplicates_to_delete AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY title, DATE(start_date), entry_fee 
      ORDER BY created_at DESC
    ) as duplicate_rank
  FROM challenges
  WHERE title LIKE '%Daily Smile Challenge%'
    AND is_recurring = true
)
DELETE FROM challenges
WHERE id IN (
  SELECT id 
  FROM duplicates_to_delete 
  WHERE duplicate_rank > 1  -- Keep rank 1 (most recent), delete others
)
RETURNING id, title, start_date, entry_fee, created_at;


