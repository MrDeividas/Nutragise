-- Fix RLS policy to allow users to check their own admin status
-- This fixes the chicken-and-egg problem where users can't check if they're admin

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;

-- Create a policy that allows users to check if THEY are an admin
CREATE POLICY "Users can check own admin status" ON admin_users
  FOR SELECT
  USING (user_id = auth.uid());

-- Create a policy that allows admins to view all admin_users
CREATE POLICY "Admins can view all admin_users" ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

