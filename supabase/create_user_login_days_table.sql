-- Create user_login_days table for tracking login streaks
CREATE TABLE IF NOT EXISTS user_login_days (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, login_date)
);

-- Add RLS policies
ALTER TABLE user_login_days ENABLE ROW LEVEL SECURITY;

-- Users can read their own login days
CREATE POLICY "Users can view their own login days"
  ON user_login_days
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/upsert their own login days
-- Both USING and WITH CHECK are needed for upsert operations
CREATE POLICY "Users can insert their own login days"
  ON user_login_days
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own login days (for upsert)
CREATE POLICY "Users can update their own login days"
  ON user_login_days
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_login_days_user_id ON user_login_days(user_id);
CREATE INDEX IF NOT EXISTS idx_user_login_days_date ON user_login_days(user_id, login_date DESC);

