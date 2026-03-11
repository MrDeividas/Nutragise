-- Create meditation_sessions table to track completed meditation sessions
CREATE TABLE IF NOT EXISTS meditation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_title TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own meditation sessions
CREATE POLICY "Users can view own meditation sessions" ON meditation_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own meditation sessions
CREATE POLICY "Users can insert own meditation sessions" ON meditation_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_user_id ON meditation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_meditation_sessions_completed_at ON meditation_sessions(completed_at);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_meditation_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_meditation_sessions_updated_at
  BEFORE UPDATE ON meditation_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_meditation_sessions_updated_at();
