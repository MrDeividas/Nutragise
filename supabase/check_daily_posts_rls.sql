-- Check if daily_posts table exists and has proper RLS policies
-- Run this to diagnose journey loading issues

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'daily_posts'
) as table_exists;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'daily_posts';

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
WHERE tablename = 'daily_posts';

-- Check indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'daily_posts'
ORDER BY indexname;

-- Count records (to see if table has data)
SELECT COUNT(*) as total_records FROM daily_posts;

-- Sample query to test performance (replace user_id with actual ID)
-- EXPLAIN ANALYZE
-- SELECT * FROM daily_posts 
-- WHERE user_id = 'YOUR_USER_ID_HERE'
-- ORDER BY date DESC 
-- LIMIT 10;

