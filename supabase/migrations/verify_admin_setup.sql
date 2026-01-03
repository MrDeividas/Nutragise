-- Verify admin setup for deividasg
-- Run this to check if admin_users table exists and if deividasg is an admin

-- Check if admin_users table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'admin_users'
) AS table_exists;

-- Check if deividasg is in admin_users
SELECT 
  au.user_id,
  p.username,
  p.display_name,
  au.is_active,
  au.granted_at,
  au.granted_by
FROM admin_users au
JOIN profiles p ON p.id = au.user_id
WHERE p.username = 'deividasg';

-- Check RLS policies on admin_users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'admin_users';

