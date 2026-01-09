-- Fix Public Read Access Security Issue
-- This migration removes public read access and replaces it with authenticated users only
-- This keeps the feed working (users are authenticated) while fixing the security vulnerability

-- ============================================
-- Fix daily_habits table
-- ============================================

-- Drop the existing public read policy if it exists
DROP POLICY IF EXISTS "Public can view daily habits" ON daily_habits;

-- Create new policy: Authenticated users can view daily habits
-- This allows the feed to work since all app users are authenticated
CREATE POLICY "Authenticated users can view daily habits" ON daily_habits
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================
-- Fix user_points_daily table
-- ============================================

-- Drop the existing public read policy if it exists
DROP POLICY IF EXISTS "Public can view user points" ON user_points_daily;

-- Create new policy: Authenticated users can view user points
-- This allows the feed to work since all app users are authenticated
CREATE POLICY "Authenticated users can view user points" ON user_points_daily
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- ============================================
-- Verification
-- ============================================
-- After running this migration, verify:
-- 1. Feed still loads (users are authenticated)
-- 2. User profiles can view other users' data (users are authenticated)
-- 3. Public/unauthenticated access is blocked (security fixed)
