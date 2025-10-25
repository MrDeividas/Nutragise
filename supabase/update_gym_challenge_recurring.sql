-- Update existing challenges table to add recurring fields
-- Run this if you already have the challenges table created

-- Add recurring challenge columns
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS recurring_schedule TEXT CHECK (recurring_schedule IN ('weekly', 'monthly', 'daily'));

ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS next_recurrence TIMESTAMP WITH TIME ZONE;

-- Update the Gym Warrior Challenge to be weekly recurring
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

-- Update the requirement for Gym Warrior Challenge
UPDATE challenge_requirements 
SET 
  requirement_text = 'Go to gym 3 times per week',
  frequency = 'weekly',
  target_count = 3
WHERE challenge_id = (SELECT id FROM challenges WHERE title = 'Gym Warrior Challenge' LIMIT 1);
