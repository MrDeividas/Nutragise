-- Add deividasg as the first admin user
-- This script finds the user by username and grants them admin access
-- Note: Make sure to run add_challenge_review_columns.sql first to create the admin_users table

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active) WHERE is_active = true;

-- Enable RLS if not already enabled
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Temporarily disable RLS to insert first admin (if policies exist, they'll block the insert)
DO $$
BEGIN
  -- Drop existing policies temporarily if they exist
  DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;
  DROP POLICY IF EXISTS "Admins can insert admin_users" ON admin_users;
  DROP POLICY IF EXISTS "Admins can update admin_users" ON admin_users;
  DROP POLICY IF EXISTS "Admins can delete admin_users" ON admin_users;
END $$;

-- Insert the first admin
INSERT INTO admin_users (user_id, granted_by, is_active)
SELECT 
  id as user_id,
  id as granted_by,  -- Self-granted for first admin
  true as is_active
FROM profiles
WHERE username = 'deividasg'
LIMIT 1
ON CONFLICT (user_id) DO UPDATE
SET is_active = true;

-- Recreate RLS policies (after first admin is inserted)
-- Policy: Users can check if they themselves are an admin
CREATE POLICY "Users can check own admin status" ON admin_users
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Admins can view all admin_users
CREATE POLICY "Admins can view all admin_users" ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Admins can insert admin_users" ON admin_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Admins can update admin_users" ON admin_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Admins can delete admin_users" ON admin_users
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Verify the admin was created
SELECT 
  au.user_id,
  p.username,
  p.display_name,
  au.granted_at,
  au.is_active
FROM admin_users au
JOIN profiles p ON p.id = au.user_id
WHERE p.username = 'deividasg';

