-- Add approval_status column to challenges table
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add review tracking columns to challenges table
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add is_invalid column to challenge_participants table
ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS is_invalid BOOLEAN DEFAULT false;

-- Add invalidation tracking columns to challenge_participants table
ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS invalidated_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS invalidated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invalidation_reason TEXT;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_challenges_approval_status ON challenges(approval_status) WHERE approval_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_challenge_participants_is_invalid ON challenge_participants(is_invalid) WHERE is_invalid = true;
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_invalid ON challenge_participants(challenge_id, is_invalid);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active) WHERE is_active = true;

-- RLS policies for admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can check if they themselves are an admin
-- This avoids infinite recursion by only checking the user's own ID (no subquery)
CREATE POLICY "Users can check own admin status" ON admin_users
  FOR SELECT
  USING (user_id = auth.uid());

-- Note: Admin management (insert/update/delete) should be done via service role
-- or database functions to avoid RLS recursion issues.
-- The app only needs SELECT to check if a user is an admin.

