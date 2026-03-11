-- Diagnostic query to check Daily Smile Challenge status
-- Run this in Supabase SQL Editor to see what's in the database

-- 1. Check if any Daily Smile Challenge exists (parent or instances)
SELECT 
  id,
  title,
  start_date,
  end_date,
  entry_fee,
  status,
  is_recurring,
  recurring_schedule,
  created_at,
  created_by
FROM challenges
WHERE title LIKE '%Daily Smile Challenge%'
ORDER BY created_at DESC;

-- 2. Check specifically for parent challenge (should have status='active' and is_recurring=true)
-- This is what the handleRecurringChallenges() function looks for
SELECT 
  id,
  title,
  start_date,
  end_date,
  entry_fee,
  status,
  is_recurring,
  recurring_schedule,
  created_at,
  CASE 
    WHEN status = 'active' AND is_recurring = true THEN '✅ PARENT CHALLENGE (Will generate daily instances)'
    WHEN is_recurring = true AND status != 'active' THEN '⚠️ PARENT CHALLENGE BUT NOT ACTIVE (Will NOT generate instances)'
    WHEN is_recurring = true THEN '📅 DAILY INSTANCE (Generated from parent)'
    ELSE '❓ UNKNOWN TYPE'
  END as challenge_type
FROM challenges
WHERE title LIKE '%Daily Smile Challenge%'
ORDER BY 
  CASE 
    WHEN status = 'active' AND is_recurring = true THEN 1
    WHEN is_recurring = true THEN 2
    ELSE 3
  END,
  created_at DESC;

-- 3. Count challenges by status
SELECT 
  status,
  COUNT(*) as count,
  STRING_AGG(DISTINCT entry_fee::text, ', ') as entry_fees
FROM challenges
WHERE title LIKE '%Daily Smile Challenge%'
GROUP BY status
ORDER BY status;

-- 4. Check for today's instance
SELECT 
  id,
  title,
  start_date,
  end_date,
  status,
  entry_fee,
  CASE 
    WHEN DATE(start_date) = CURRENT_DATE THEN '✅ TODAY'
    WHEN DATE(start_date) < CURRENT_DATE THEN '⏪ PAST'
    WHEN DATE(start_date) > CURRENT_DATE THEN '⏩ FUTURE'
  END as date_status
FROM challenges
WHERE title LIKE '%Daily Smile Challenge%'
  AND is_recurring = true
ORDER BY start_date DESC
LIMIT 10;
