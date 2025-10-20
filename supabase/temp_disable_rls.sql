-- Temporary fix: Disable RLS on profiles table to test
-- This will allow profile creation to work while we debug the RLS policies

-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Test: Try to insert a profile manually to verify it works
-- (This is just for testing - you can run this separately)
/*
INSERT INTO profiles (id, username, display_name, onboarding_completed) 
VALUES ('test-user-id', 'testuser', 'Test User', false);
*/
