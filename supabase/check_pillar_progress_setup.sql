-- Check if pillar_progress table exists and has proper setup
-- Run this to diagnose pillar tracking issues

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'pillar_progress'
) as table_exists;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'pillar_progress';

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'pillar_progress';

-- Check if user has pillar records (replace with your user_id)
-- SELECT user_id, pillar_type, progress_percentage, last_activity_date, actions_today
-- FROM pillar_progress
-- WHERE user_id = 'YOUR_USER_ID_HERE'
-- ORDER BY pillar_type;

-- Check indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'pillar_progress'
ORDER BY indexname;

