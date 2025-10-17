-- Fix RLS policies for unread_counts table
-- This allows the trigger to insert unread counts for any user

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view their unread counts" ON unread_counts;
DROP POLICY IF EXISTS "Users can update their unread counts" ON unread_counts;
DROP POLICY IF EXISTS "Users can manage their unread counts" ON unread_counts;
DROP POLICY IF EXISTS "Users can delete their unread counts" ON unread_counts;

-- Create separate policies for each operation
CREATE POLICY "Users can view their unread counts"
  ON unread_counts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their unread counts"
  ON unread_counts FOR INSERT
  WITH CHECK (true);  -- Allow trigger to insert for any user

CREATE POLICY "Users can update their unread counts"
  ON unread_counts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their unread counts"
  ON unread_counts FOR DELETE
  USING (auth.uid() = user_id);

