-- Fix RLS policy to allow users to create their own profile during sign-up
-- This policy allows INSERT for authenticated users creating their own profile

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create new insert policy that allows users to create their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Also ensure the select policy allows reading own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- And update policy for own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

