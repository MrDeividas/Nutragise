-- Script to identify and clean up duplicate Daily Smile Challenge instances
-- Run this in Supabase SQL Editor to find and optionally remove duplicates

-- Step 1: Identify duplicate Daily Smile Challenges
-- This query shows all Daily Smile Challenge instances grouped by date and entry_fee
SELECT 
  title,
  DATE(start_date) as challenge_date,
  entry_fee,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ' ORDER BY created_at DESC) as challenge_ids,
  STRING_AGG(created_at::text, ', ' ORDER BY created_at DESC) as created_dates
FROM challenges
WHERE title LIKE '%Daily Smile Challenge%'
  AND is_recurring = true
GROUP BY title, DATE(start_date), entry_fee
HAVING COUNT(*) > 1
ORDER BY challenge_date DESC, entry_fee;

-- Step 2: View all Daily Smile Challenges with details
-- This helps you see which ones to keep and which to delete
SELECT 
  id,
  title,
  start_date,
  end_date,
  entry_fee,
  status,
  created_at,
  ROW_NUMBER() OVER (
    PARTITION BY title, DATE(start_date), entry_fee 
    ORDER BY created_at DESC
  ) as duplicate_rank
FROM challenges
WHERE title LIKE '%Daily Smile Challenge%'
  AND is_recurring = true
ORDER BY start_date DESC, entry_fee, created_at DESC;

-- Step 3: DELETE duplicate Daily Smile Challenges (KEEP THE MOST RECENT ONE)
-- ⚠️ WARNING: This will delete duplicate challenges, keeping only the most recent one per day/entry_fee
-- ⚠️ Make sure to backup your database before running this!
-- ⚠️ This will also delete related data (participants, submissions, pots) for the deleted challenges

-- Uncomment the DELETE statement below ONLY after reviewing the SELECT queries above
-- and confirming which challenges should be deleted

/*
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
*/


