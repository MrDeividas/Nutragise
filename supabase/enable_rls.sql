-- ============================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================
-- ⚠️ WARNING: Only run this AFTER:
--    1. Running create_rls_policies.sql
--    2. Testing your app thoroughly
--    3. Verifying all policies are correct
-- ============================================
-- This activates all the policies you created
-- Run during low-traffic period if possible
-- ============================================

BEGIN;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

-- Core user tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Goal and progress tables
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;

-- Post tables
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_posts ENABLE ROW LEVEL SECURITY;

-- Habit tracking
ALTER TABLE daily_habits ENABLE ROW LEVEL SECURITY;

-- Social features
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Engagement (if tables exist - won't error if they don't)
ALTER TABLE IF EXISTS likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comments ENABLE ROW LEVEL SECURITY;

-- System tables
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS points ENABLE ROW LEVEL SECURITY;

-- DM tables (should already be enabled from previous scripts)
-- But let's ensure they are
ALTER TABLE IF EXISTS chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS unread_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS push_tokens ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================
-- VERIFY RLS IS ENABLED
-- ============================================

SELECT 
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- ============================================
-- POST-ENABLEMENT CHECKLIST
-- ============================================
-- After running this script, TEST:
-- 
-- [ ] Sign in to app
-- [ ] View your goals
-- [ ] Create a new goal
-- [ ] Update a goal
-- [ ] Delete a test goal
-- [ ] View home feed
-- [ ] Create a post
-- [ ] View your profile
-- [ ] Search for users
-- [ ] Follow someone
-- [ ] Upload a progress photo
-- [ ] View daily habits
-- 
-- SECURITY TESTS:
-- [ ] Try to access another user's data (should fail)
-- [ ] Verify public posts are visible to everyone
-- [ ] Verify private data is hidden from others
-- ============================================

-- If something breaks, you can disable RLS temporarily:
-- ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

