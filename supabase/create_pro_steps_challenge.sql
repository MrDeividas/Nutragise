-- Create 15K Steps Daily Pro Challenge
-- This is a recurring weekly challenge exclusive to Pro members

-- 1. Create the 15k Steps Daily Challenge
INSERT INTO challenges (
  title, 
  description, 
  category, 
  duration_weeks, 
  entry_fee, 
  verification_type, 
  start_date, 
  end_date, 
  status, 
  is_recurring, 
  recurring_schedule,
  is_pro_only,
  image_url,
  created_by
) VALUES (
  '15K Steps Daily Challenge',
  'Walk 15,000 steps every day for a week. Pro members only. Complete all days to win the pot!',
  'fitness',
  1,
  10.00, -- $10 entry fee
  'manual',
  -- Start next Monday at 00:01
  date_trunc('week', NOW() + interval '1 week') + interval '1 minute',
  -- End next Sunday at 23:59
  date_trunc('week', NOW() + interval '1 week') + interval '6 days 23 hours 59 minutes',
  'active',
  true,
  'weekly',
  true, -- Pro only
  'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800', -- Steps/walking image
  (SELECT id FROM profiles WHERE is_pro = true LIMIT 1) -- System/admin user
) RETURNING id;

-- 2. Add challenge requirements
-- Note: We need to get the challenge ID from the previous INSERT
-- This can be done by running these statements separately or using a transaction

INSERT INTO challenge_requirements (
  challenge_id,
  requirement_text,
  frequency,
  target_count,
  requirement_order
)
SELECT 
  id,
  'Walk 15,000 steps',
  'daily',
  7, -- 7 days
  1
FROM challenges 
WHERE title = '15K Steps Daily Challenge' 
AND is_recurring = true 
AND is_pro_only = true
ORDER BY created_at DESC
LIMIT 1;

-- 3. Create the challenge pot for investment tracking
INSERT INTO challenge_pots (
  challenge_id,
  total_amount,
  platform_fee_percentage,
  platform_fee_amount,
  winners_pot,
  status
)
SELECT 
  id,
  0.00,
  30.00, -- 30% platform fee
  0.00,
  0.00,
  'collecting'
FROM challenges 
WHERE title = '15K Steps Daily Challenge' 
AND is_recurring = true 
AND is_pro_only = true
ORDER BY created_at DESC
LIMIT 1;

