-- Fix RLS policies for user_login_days table
-- Run this if you're getting RLS policy violations

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own login days" ON user_login_days;
DROP POLICY IF EXISTS "Users can update their own login days" ON user_login_days;

-- Recreate INSERT policy
CREATE POLICY "Users can insert their own login days"
  ON user_login_days
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add UPDATE policy (needed for upsert operations)
CREATE POLICY "Users can update their own login days"
  ON user_login_days
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Verify policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'user_login_days';

