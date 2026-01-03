-- Fix infinite recursion in admin_users RLS policies
-- The issue: Policies that check admin_users table cause infinite recursion

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can view all admin_users" ON admin_users;
DROP POLICY IF EXISTS "Users can check own admin status" ON admin_users;
DROP POLICY IF EXISTS "Admins can insert admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can update admin_users" ON admin_users;
DROP POLICY IF EXISTS "Admins can delete admin_users" ON admin_users;

-- Create a simple policy that allows users to check if THEY are an admin
-- This avoids recursion because it only checks their own user_id
CREATE POLICY "Users can check own admin status" ON admin_users
  FOR SELECT
  USING (user_id = auth.uid());

-- For admin operations (insert/update/delete), we'll use a function-based approach
-- OR we can allow service role to manage admins directly
-- For now, let's create policies that don't cause recursion

-- Note: Admins managing other admins will need to be done via service role or database functions
-- For the app, we only need users to check their own admin status

-- If you need admins to view all admins, create a database function that bypasses RLS:
CREATE OR REPLACE FUNCTION get_all_admins()
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  is_active BOOLEAN,
  granted_at TIMESTAMP WITH TIME ZONE
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.user_id,
    p.username,
    p.display_name,
    au.is_active,
    au.granted_at
  FROM admin_users au
  JOIN profiles p ON p.id = au.user_id
  WHERE EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
    AND admin_users.is_active = true
  );
END;
$$;

-- For insert/update/delete, we'll need to handle via service role or functions
-- For now, let's just ensure the SELECT policy works for checking own status

