-- Check the actual column types in pillar_progress table
SELECT 
  column_name,
  data_type,
  numeric_precision,
  numeric_scale,
  column_default
FROM information_schema.columns
WHERE table_name = 'pillar_progress'
ORDER BY ordinal_position;

-- Also check a sample of actual data
SELECT 
  pillar_type,
  progress_percentage,
  pg_typeof(progress_percentage) as data_type
FROM pillar_progress
LIMIT 5;



