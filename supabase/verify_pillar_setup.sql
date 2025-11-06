-- Verify pillar_progress table setup
-- Run this to check if everything is configured correctly

-- 1. Check if table exists
SELECT 
  'Table exists' as status,
  count(*) as total_records
FROM pillar_progress;

-- 2. Check table structure
SELECT 
  column_name, 
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'pillar_progress'
ORDER BY ordinal_position;

-- 3. Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'pillar_progress';

-- 4. Check RLS policies
SELECT 
  policyname,
  cmd as command,
  qual as using_expression,
  with_check
FROM pg_policies 
WHERE tablename = 'pillar_progress';

-- 5. Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'pillar_progress';

-- 6. Check data for current user (you'll need to be logged in)
-- This will show YOUR pillar data
SELECT 
  pillar_type,
  progress_percentage,
  actions_today,
  last_activity_date,
  created_at
FROM pillar_progress
WHERE user_id = auth.uid()
ORDER BY pillar_type;

-- 7. Count users with pillar data
SELECT 
  COUNT(DISTINCT user_id) as users_with_pillars,
  COUNT(*) as total_pillar_records
FROM pillar_progress;



