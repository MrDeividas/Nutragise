-- Initialize pillar progress for existing users
-- Run this after creating the pillar_progress table

INSERT INTO pillar_progress (user_id, pillar_type, progress_percentage, last_activity_date, actions_today)
SELECT 
  u.id as user_id,
  pillar.pillar_type,
  35.0 as progress_percentage,
  CURRENT_DATE as last_activity_date,
  0 as actions_today
FROM 
  auth.users u
CROSS JOIN (
  VALUES 
    ('strength_fitness'),
    ('growth_wisdom'),
    ('discipline'),
    ('team_spirit'),
    ('overall')
) AS pillar(pillar_type)
ON CONFLICT (user_id, pillar_type) DO NOTHING;

-- Verify initialization
SELECT pillar_type, COUNT(*) as user_count
FROM pillar_progress
GROUP BY pillar_type
ORDER BY pillar_type;

