-- Create user_points_daily table
CREATE TABLE IF NOT EXISTS user_points_daily (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Daily habits completion tracking
  gym_completed BOOLEAN DEFAULT FALSE,
  meditation_completed BOOLEAN DEFAULT FALSE,
  microlearn_completed BOOLEAN DEFAULT FALSE,
  sleep_completed BOOLEAN DEFAULT FALSE,
  water_completed BOOLEAN DEFAULT FALSE,
  run_completed BOOLEAN DEFAULT FALSE,
  reflect_completed BOOLEAN DEFAULT FALSE,
  cold_shower_completed BOOLEAN DEFAULT FALSE,
  
  -- Core habits completion tracking
  liked_today BOOLEAN DEFAULT FALSE,
  commented_today BOOLEAN DEFAULT FALSE,
  shared_today BOOLEAN DEFAULT FALSE,
  updated_goal_today BOOLEAN DEFAULT FALSE,
  
  -- Points breakdown
  daily_habits_points INTEGER DEFAULT 0,
  core_habits_points INTEGER DEFAULT 0,
  bonus_points INTEGER DEFAULT 0,
  total_points_today INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (user_id, date)
);

-- Create user_points_total table
CREATE TABLE IF NOT EXISTS user_points_total (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_points_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points_total ENABLE ROW LEVEL SECURITY;

-- Policies for user_points_daily
CREATE POLICY "Users can view their own daily points"
  ON user_points_daily FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily points"
  ON user_points_daily FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily points"
  ON user_points_daily FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies for user_points_total
CREATE POLICY "Users can view their own total points"
  ON user_points_total FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own total points"
  ON user_points_total FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own total points"
  ON user_points_total FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_points_daily_user_date ON user_points_daily(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_user_points_total_user ON user_points_total(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_points_daily
CREATE TRIGGER update_user_points_daily_updated_at
  BEFORE UPDATE ON user_points_daily
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for user_points_total
CREATE TRIGGER update_user_points_total_updated_at
  BEFORE UPDATE ON user_points_total
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

