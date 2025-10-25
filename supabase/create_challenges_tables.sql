-- Create challenges tables for the challenges feature
-- This includes all necessary tables and RLS policies

-- 1. Challenges table
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
  entry_fee DECIMAL(10,2) DEFAULT 0.00, -- For future Stripe integration
  verification_type TEXT DEFAULT 'photo' CHECK (verification_type IN ('photo', 'manual', 'automatic')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  max_participants INTEGER, -- Optional limit
  image_url TEXT, -- For challenge illustration
  is_recurring BOOLEAN DEFAULT false,
  recurring_schedule TEXT CHECK (recurring_schedule IN ('weekly', 'monthly', 'daily')),
  next_recurrence TIMESTAMP WITH TIME ZONE -- When the next occurrence should start
);

-- 2. Challenge participants table
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'left')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  completion_percentage DECIMAL(5,2) DEFAULT 0.00,
  UNIQUE(challenge_id, user_id)
);

-- 3. Challenge submissions table
CREATE TABLE IF NOT EXISTS challenge_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  week_number INTEGER NOT NULL CHECK (week_number > 0),
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  submission_notes TEXT, -- Optional notes from user
  UNIQUE(challenge_id, user_id, week_number)
);

-- 4. Challenge requirements table
CREATE TABLE IF NOT EXISTS challenge_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  requirement_text TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly')),
  target_count INTEGER NOT NULL CHECK (target_count > 0),
  requirement_order INTEGER DEFAULT 1
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_category ON challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_challenge ON challenge_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_user ON challenge_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_requirements_challenge ON challenge_requirements(challenge_id);

-- Enable RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges table
CREATE POLICY "Anyone can view challenges" ON challenges
  FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can create challenges" ON challenges
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only challenge creators can update challenges" ON challenges
  FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for challenge_participants table
CREATE POLICY "Anyone can view challenge participants" ON challenge_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join challenges" ON challenge_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" ON challenge_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave challenges" ON challenge_participants
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for challenge_submissions table
CREATE POLICY "Users can view their own submissions" ON challenge_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can submit photos for challenges they joined" ON challenge_submissions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM challenge_participants 
      WHERE challenge_id = challenge_submissions.challenge_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own submissions" ON challenge_submissions
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for challenge_requirements table
CREATE POLICY "Anyone can view challenge requirements" ON challenge_requirements
  FOR SELECT USING (true);

-- Insert the 2 hardcoded challenges
INSERT INTO challenges (title, description, category, duration_weeks, entry_fee, verification_type, start_date, end_date, created_by, status, image_url, is_recurring, recurring_schedule, next_recurrence) VALUES
(
  'Gym Warrior Challenge',
  'Commit to going to the gym 3 times per week. Upload photos as proof of your gym sessions. This challenge runs weekly from Monday to Sunday.',
  'Fitness',
  1,
  0.00,
  'photo',
  '2024-01-29 00:01:00+00', -- Monday 29th January 2024 at 00:01 UTC
  '2024-02-04 23:59:00+00', -- Sunday 4th February 2024 at 23:59 UTC
  (SELECT id FROM auth.users LIMIT 1), -- Use first user as creator for now
  'active',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
  true,
  'weekly',
  '2024-02-05 00:01:00+00' -- Next Monday at 00:01 UTC
),
(
  '10K Steps Daily Challenge',
  'Walk 10,000 steps every single day for 2 weeks. Upload screenshots of your step count as verification.',
  'Wellness',
  2,
  0.00,
  'photo',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '2 weeks',
  (SELECT id FROM auth.users LIMIT 1), -- Use first user as creator for now
  'active',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
  false,
  null,
  null
);

-- Insert requirements for the challenges
INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order) VALUES
-- Gym Warrior Challenge requirements
(
  (SELECT id FROM challenges WHERE title = 'Gym Warrior Challenge'),
  'Go to gym 3 times per week',
  'weekly',
  3,
  1
),
-- 10K Steps Challenge requirements
(
  (SELECT id FROM challenges WHERE title = '10K Steps Daily Challenge'),
  'Complete 10,000 steps every day',
  'daily',
  1,
  1
);
