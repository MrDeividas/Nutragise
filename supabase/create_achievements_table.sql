-- Create user_achievements table for storing user achievements with photos
-- Run this script inside the Supabase SQL editor

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE user_achievements IS 'Stores user achievements with text and photo proof';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_created_at ON user_achievements(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can view their own achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own achievements
CREATE POLICY "Users can insert their own achievements"
  ON user_achievements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own achievements
CREATE POLICY "Users can update their own achievements"
  ON user_achievements
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own achievements
CREATE POLICY "Users can delete their own achievements"
  ON user_achievements
  FOR DELETE
  USING (auth.uid() = user_id);

