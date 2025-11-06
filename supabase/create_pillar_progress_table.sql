-- Create pillar_progress table for tracking user progression across 5 pillars
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

-- Add RLS policies
ALTER TABLE pillar_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own pillar progress
CREATE POLICY "Users can view their own pillar progress"
  ON pillar_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own pillar progress
CREATE POLICY "Users can insert their own pillar progress"
  ON pillar_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pillar progress
CREATE POLICY "Users can update their own pillar progress"
  ON pillar_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pillar_progress_user_id ON pillar_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_pillar_progress_user_pillar ON pillar_progress(user_id, pillar_type);

