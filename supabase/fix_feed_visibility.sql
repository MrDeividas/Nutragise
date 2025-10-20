-- ============================================
-- FIX FEED VISIBILITY - Allow Public Access
-- ============================================
-- This fixes the home feed so users can see everyone's posts
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. FIX DAILY_POSTS - Make them publicly viewable
-- ============================================
DROP POLICY IF EXISTS "Users can view own daily posts" ON daily_posts;
DROP POLICY IF EXISTS "Public daily posts are viewable by everyone" ON daily_posts;

-- Users can view ALL daily posts (they're meant to be public/social)
CREATE POLICY "Public daily posts are viewable by everyone"
  ON daily_posts FOR SELECT
  USING (true);

-- ============================================
-- 2. FIX GOALS - Make all goals viewable for explore
-- ============================================
DROP POLICY IF EXISTS "All goals are viewable for explore" ON goals;

CREATE POLICY "All goals are viewable for explore"
  ON goals FOR SELECT
  USING (true);

-- ============================================
-- 3. POSTS TABLE - Already correct
-- ============================================
-- Posts already have "Public posts are viewable by everyone" policy
-- which checks is_public = true, so this is correct

-- ============================================
-- Verification
-- ============================================
-- Show the policies for verification
SELECT 
  tablename,
  policyname,
  cmd as "Operation"
FROM pg_policies 
WHERE tablename IN ('daily_posts', 'goals', 'posts')
  AND cmd = 'SELECT'
ORDER BY tablename, policyname;
