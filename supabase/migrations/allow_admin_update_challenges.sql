-- Allow admins to update challenges for review purposes
-- This is needed for the admin review screen to approve/reject challenges

-- Drop existing admin policy if it exists
DROP POLICY IF EXISTS "Admins can update challenges" ON challenges;

-- Create policy: Admins can update challenges (for review purposes)
CREATE POLICY "Admins can update challenges" ON challenges
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Also allow admins to view all challenges (needed for review)
DROP POLICY IF EXISTS "Admins can view all challenges" ON challenges;

CREATE POLICY "Admins can view all challenges" ON challenges
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
    OR
    -- Also allow regular users to see challenges they can normally see
    -- (this maintains existing functionality)
    approval_status IS NULL
    OR approval_status = 'approved'
  );

