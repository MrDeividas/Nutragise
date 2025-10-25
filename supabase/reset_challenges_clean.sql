-- Clean up duplicates and reset recurring challenges properly
-- This will fix the duplicate issue and set up proper recurring challenges

-- First, delete all existing challenges to start fresh
DELETE FROM challenge_submissions;
DELETE FROM challenge_participants;
DELETE FROM challenge_requirements;
DELETE FROM challenges;

-- Insert the 2 challenges as weekly recurring (starting fresh)
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
  (SELECT id FROM auth.users LIMIT 1),
  'active',
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
  true,
  'weekly',
  '2024-02-05 00:01:00+00' -- Next Monday at 00:01 UTC
),
(
  '10K Steps Daily Challenge',
  'Walk 10,000 steps every single day for 1 week. Upload screenshots of your step count as verification. This challenge runs weekly from Monday to Sunday.',
  'Wellness',
  1,
  0.00,
  'photo',
  '2024-01-29 00:01:00+00', -- Monday 29th January 2024 at 00:01 UTC
  '2024-02-04 23:59:00+00', -- Sunday 4th February 2024 at 23:59 UTC
  (SELECT id FROM auth.users LIMIT 1),
  'active',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop',
  true,
  'weekly',
  '2024-02-05 00:01:00+00' -- Next Monday at 00:01 UTC
);

-- Insert requirements for the challenges
INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order, max_submissions_per_period) VALUES
-- Gym Warrior Challenge requirements
(
  (SELECT id FROM challenges WHERE title = 'Gym Warrior Challenge' LIMIT 1),
  'Go to gym 3 times per week',
  'weekly',
  3,
  1,
  3
),
-- 10K Steps Challenge requirements
(
  (SELECT id FROM challenges WHERE title = '10K Steps Daily Challenge' LIMIT 1),
  'Complete 10,000 steps every day',
  'daily',
  1,
  1,
  1
);

-- Verify we have exactly 2 challenges
SELECT title, COUNT(*) as count 
FROM challenges 
GROUP BY title;
