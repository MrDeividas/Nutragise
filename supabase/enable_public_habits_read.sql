-- Enable public read access for daily_habits table
-- This allows the feed to display real-time habit completion data for all users

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own daily habits" ON daily_habits;
DROP POLICY IF EXISTS "Users can insert own daily habits" ON daily_habits;
DROP POLICY IF EXISTS "Users can update own daily habits" ON daily_habits;

-- Allow everyone to view all daily habits (for feed display)
CREATE POLICY "Public can view daily habits" ON daily_habits
  FOR SELECT
  USING (true);

-- Allow users to insert/update their own daily habits
CREATE POLICY "Users can insert own daily habits" ON daily_habits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily habits" ON daily_habits
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable public read access for user_points_daily table
-- This allows the feed to display meditation/microlearn/screen_time completion

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own points" ON user_points_daily;
DROP POLICY IF EXISTS "Users can insert own points" ON user_points_daily;
DROP POLICY IF EXISTS "Users can update own points" ON user_points_daily;

-- Allow everyone to view all user points (for feed display)
CREATE POLICY "Public can view user points" ON user_points_daily
  FOR SELECT
  USING (true);

-- Allow users to insert/update their own points
CREATE POLICY "Users can insert own points" ON user_points_daily
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own points" ON user_points_daily
  FOR UPDATE
  USING (auth.uid() = user_id);

