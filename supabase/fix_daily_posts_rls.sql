-- Fix RLS policies for daily_posts table if they're causing slow queries
-- Run this if journey modal is slow or timing out

-- Enable RLS
ALTER TABLE daily_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own daily posts" ON daily_posts;
DROP POLICY IF EXISTS "Users can view public daily posts" ON daily_posts;
DROP POLICY IF EXISTS "Users can insert their own daily posts" ON daily_posts;
DROP POLICY IF EXISTS "Users can update their own daily posts" ON daily_posts;
DROP POLICY IF EXISTS "Users can delete their own daily posts" ON daily_posts;

-- Create optimized SELECT policy (users can view their own posts)
CREATE POLICY "Users can view their own daily posts"
  ON daily_posts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create INSERT policy
CREATE POLICY "Users can insert their own daily posts"
  ON daily_posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create UPDATE policy
CREATE POLICY "Users can update their own daily posts"
  ON daily_posts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create DELETE policy
CREATE POLICY "Users can delete their own daily posts"
  ON daily_posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Verify policies were created
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'daily_posts';

