-- Fix and complete pillar_progress table setup
-- Run this if you're getting "already exists" errors

-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Users can view their own pillar progress" ON pillar_progress;
DROP POLICY IF EXISTS "Users can insert their own pillar progress" ON pillar_progress;
DROP POLICY IF EXISTS "Users can update their own pillar progress" ON pillar_progress;

-- Ensure table exists with correct structure
CREATE TABLE IF NOT EXISTS pillar_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pillar_type TEXT NOT NULL CHECK (pillar_type IN ('strength_fitness', 'growth_wisdom', 'discipline', 'team_spirit', 'overall')),
  progress_percentage NUMERIC NOT NULL DEFAULT 35.0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_activity_date DATE,
  actions_today INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, pillar_type)
);

-- Enable RLS
ALTER TABLE pillar_progress ENABLE ROW LEVEL SECURITY;

-- Create fresh policies
CREATE POLICY "Users can view their own pillar progress"
  ON pillar_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pillar progress"
  ON pillar_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pillar progress"
  ON pillar_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pillar_progress_user_id ON pillar_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_pillar_progress_user_pillar ON pillar_progress(user_id, pillar_type);

-- Initialize pillars for existing users
INSERT INTO pillar_progress (user_id, pillar_type, progress_percentage, last_activity_date, actions_today)
SELECT 
  u.id as user_id,
  pillar.pillar_type,
  35.0 as progress_percentage,
  CURRENT_DATE as last_activity_date,
  0 as actions_today
FROM 
  auth.users u
CROSS JOIN (
  VALUES 
    ('strength_fitness'),
    ('growth_wisdom'),
    ('discipline'),
    ('team_spirit'),
    ('overall')
) AS pillar(pillar_type)
ON CONFLICT (user_id, pillar_type) DO NOTHING;

-- Verify setup
SELECT 
  'Pillar progress table setup complete!' as status,
  COUNT(DISTINCT user_id) as total_users,
  COUNT(*) as total_pillar_records
FROM pillar_progress;



