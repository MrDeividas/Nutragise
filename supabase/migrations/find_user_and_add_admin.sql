-- Find user and add as admin
-- This script helps you find the correct username and adds them as admin

-- Step 1: Find users with similar usernames
SELECT id, username, display_name, created_at 
FROM profiles 
WHERE username LIKE '%deividas%' 
   OR display_name LIKE '%deividas%'
   OR username LIKE '%david%'
ORDER BY created_at DESC;

-- Step 2: Once you find the correct user, replace 'USER_ID_HERE' with the actual ID from above
-- Then run this to add them as admin:

-- First, ensure admin_users table exists
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active) WHERE is_active = true;

-- Disable RLS temporarily
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Insert admin (replace USER_ID_HERE with actual user ID from Step 1)
-- Example: INSERT INTO admin_users (user_id, granted_by, is_active) VALUES ('123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174000', true);
INSERT INTO admin_users (user_id, granted_by, is_active)
SELECT 
  id as user_id,
  id as granted_by,
  true as is_active
FROM profiles
WHERE username = 'deividasg'
LIMIT 1
ON CONFLICT (user_id) DO UPDATE
SET is_active = true;

-- Re-enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (simple, no recursion)
DROP POLICY IF EXISTS "Users can check own admin status" ON admin_users;
DROP POLICY IF EXISTS "Admins can view all admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can insert admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can update admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can delete admin_users" ON admin_users;

-- Simple policy: Users can check if THEY are an admin (no recursion)
CREATE POLICY "Users can check own admin status" ON admin_users
  FOR SELECT
  USING (user_id = auth.uid());

-- Note: Admin management operations should be done via service role or database functions

-- Verify
SELECT 
  au.user_id,
  p.username,
  p.display_name,
  au.is_active
FROM admin_users au
JOIN profiles p ON p.id = au.user_id;

