-- Allow admins to view all challenge_participants and challenge_submissions for review purposes
-- This is needed for the admin review screen to display participants and their submissions

-- ============================================
-- challenge_participants policies
-- ============================================

-- Check if RLS is enabled on challenge_participants
DO $$
BEGIN
  -- Enable RLS if not already enabled
  ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN
    -- Table might not exist or RLS already enabled, continue
    NULL;
END $$;

-- Drop existing admin policies if they exist
DROP POLICY IF EXISTS "Admins can view challenge_participants" ON challenge_participants;
DROP POLICY IF EXISTS "Admins can update challenge_participants" ON challenge_participants;

-- Create policy: Admins can view all challenge_participants
CREATE POLICY "Admins can view challenge_participants" ON challenge_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Also allow admins to update challenge_participants (for invalidating participants)
CREATE POLICY "Admins can update challenge_participants" ON challenge_participants
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- ============================================
-- challenge_submissions policies
-- ============================================

-- Check if RLS is enabled on challenge_submissions
DO $$
BEGIN
  -- Enable RLS if not already enabled
  ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN
    -- Table might not exist or RLS already enabled, continue
    NULL;
END $$;

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admins can view challenge_submissions" ON challenge_submissions;

-- Create policy: Admins can view all challenge_submissions
CREATE POLICY "Admins can view challenge_submissions" ON challenge_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

