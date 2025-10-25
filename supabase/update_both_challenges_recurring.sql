-- Update both challenges to be weekly recurring
-- Run this to update existing challenges

-- Add recurring challenge columns if they don't exist
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS recurring_schedule TEXT CHECK (recurring_schedule IN ('weekly', 'monthly', 'daily'));

ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS next_recurrence TIMESTAMP WITH TIME ZONE;

-- Add submission limit column for daily photo limits
ALTER TABLE challenge_requirements 
ADD COLUMN IF NOT EXISTS max_submissions_per_period INTEGER DEFAULT NULL;

-- Update Gym Warrior Challenge to be weekly recurring (1 week, 3 photos per week)
UPDATE challenges 
SET 
  duration_weeks = 1,
  description = 'Commit to going to the gym 3 times per week. Upload photos as proof of your gym sessions. This challenge runs weekly from Monday to Sunday.',
  start_date = '2024-01-29 00:01:00+00', -- Monday 29th January 2024 at 00:01 UTC
  end_date = '2024-02-04 23:59:00+00', -- Sunday 4th February 2024 at 23:59 UTC
  is_recurring = true,
  recurring_schedule = 'weekly',
  next_recurrence = '2024-02-05 00:01:00+00' -- Next Monday at 00:01 UTC
WHERE title = 'Gym Warrior Challenge';

-- Update 10K Steps Challenge to be weekly recurring (1 week, 1 photo per day)
UPDATE challenges 
SET 
  duration_weeks = 1,
  description = 'Walk 10,000 steps every single day for 1 week. Upload screenshots of your step count as verification. This challenge runs weekly from Monday to Sunday.',
  start_date = '2024-01-29 00:01:00+00', -- Monday 29th January 2024 at 00:01 UTC
  end_date = '2024-02-04 23:59:00+00', -- Sunday 4th February 2024 at 23:59 UTC
  is_recurring = true,
  recurring_schedule = 'weekly',
  next_recurrence = '2024-02-05 00:01:00+00' -- Next Monday at 00:01 UTC
WHERE title = '10K Steps Daily Challenge';

-- Update Gym Warrior Challenge requirement (3 photos per week)
UPDATE challenge_requirements 
SET 
  requirement_text = 'Go to gym 3 times per week',
  frequency = 'weekly',
  target_count = 3,
  max_submissions_per_period = 3
WHERE challenge_id = (SELECT id FROM challenges WHERE title = 'Gym Warrior Challenge' LIMIT 1);

-- Update 10K Steps Challenge requirement (1 photo per day, 7 days per week)
UPDATE challenge_requirements 
SET 
  requirement_text = 'Complete 10,000 steps every day',
  frequency = 'daily',
  target_count = 1,
  max_submissions_per_period = 1
WHERE challenge_id = (SELECT id FROM challenges WHERE title = '10K Steps Daily Challenge' LIMIT 1);
