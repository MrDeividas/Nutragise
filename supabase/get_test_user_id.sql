-- Get a test user ID from your database
-- Run this in Supabase SQL Editor to get a real user ID

SELECT id, email, username 
FROM profiles 
LIMIT 1;

-- Or if you want to see all users:
-- SELECT id, email, username FROM profiles;

