-- Complete admin setup script
-- Run this to ensure admin_users table exists and deividasg is an admin

-- Step 1: Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active) WHERE is_active = true;

-- Step 3: Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist (to recreate them)
DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can view all admin_users" ON admin_users;
DROP POLICY IF EXISTS "Users can check own admin status" ON admin_users;
DROP POLICY IF EXISTS "Admins can insert admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can update admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can delete admin_users" ON admin_users;

-- Step 5: Create policy that allows users to check if THEY are an admin
-- This is critical - without this, users can't check their own admin status
CREATE POLICY "Users can check own admin status" ON admin_users
  FOR SELECT
  USING (user_id = auth.uid());

-- Step 6: Create policy that allows admins to view all admin_users
CREATE POLICY "Admins can view all admin_users" ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Step 7: Temporarily disable RLS to insert first admin
-- We'll use a service role or bypass RLS for this initial insert
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Step 8: Insert deividasg as admin (or update if exists)
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

-- Step 9: Re-enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Step 10: Recreate the policies (now that admin exists)
-- IMPORTANT: Only create the simple policy that doesn't cause recursion
DROP POLICY IF EXISTS "Users can check own admin status" ON admin_users;
DROP POLICY IF EXISTS "Admins can view all admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can insert admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can update admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can delete admin_users" ON admin_users;

-- Simple policy: Users can check if THEY are an admin (no recursion)
CREATE POLICY "Users can check own admin status" ON admin_users
  FOR SELECT
  USING (user_id = auth.uid());

-- Note: Admin management (insert/update/delete) should be done via service role
-- or database functions. The app only needs to check if a user is an admin.

-- Step 11: Verify the setup
SELECT 
  'Setup Complete!' as status,
  au.user_id,
  p.username,
  p.display_name,
  au.is_active,
  au.granted_at
FROM admin_users au
JOIN profiles p ON p.id = au.user_id
WHERE p.username = 'deividasg';

-- Alternative: If username doesn't match, check all profiles to find the right one
-- SELECT id, username, display_name FROM profiles WHERE username LIKE '%deividas%' OR display_name LIKE '%deividas%';

