-- Fix pillar_progress.progress_percentage column type
-- This changes it from INTEGER (if it is) to NUMERIC to support decimals

-- First, check current type
SELECT 
  column_name,
  data_type,
  'Current type' as status
FROM information_schema.columns
WHERE table_name = 'pillar_progress' 
  AND column_name = 'progress_percentage';

-- Change column type to NUMERIC (supports decimals like 35.36)
ALTER TABLE pillar_progress 
ALTER COLUMN progress_percentage TYPE NUMERIC USING progress_percentage::NUMERIC;

-- Verify the change
SELECT 
  column_name,
  data_type,
  'After change' as status
FROM information_schema.columns
WHERE table_name = 'pillar_progress' 
  AND column_name = 'progress_percentage';

-- Show current data
SELECT 
  user_id,
  pillar_type,
  progress_percentage,
  pg_typeof(progress_percentage) as data_type
FROM pillar_progress
ORDER BY user_id, pillar_type;


