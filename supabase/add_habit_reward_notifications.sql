-- Add habit reward notification columns to notifications table
-- Run this in Supabase SQL Editor

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS points_gained INTEGER,
ADD COLUMN IF NOT EXISTS pillar_type TEXT,
ADD COLUMN IF NOT EXISTS pillar_progress REAL,
ADD COLUMN IF NOT EXISTS habit_type TEXT;

-- Add comment to explain new columns
COMMENT ON COLUMN notifications.points_gained IS 'Points earned from completing a habit';
COMMENT ON COLUMN notifications.pillar_type IS 'The pillar affected (strength_fitness, growth_wisdom, discipline, team_spirit)';
COMMENT ON COLUMN notifications.pillar_progress IS 'The percentage increase in pillar progress (e.g., 0.36)';
COMMENT ON COLUMN notifications.habit_type IS 'The type of habit completed (gym, run, meditation, etc.)';



