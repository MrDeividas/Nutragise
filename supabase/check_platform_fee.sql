-- Check platform fee for Daily Smile Challenge
SELECT 
  c.id as challenge_id,
  c.title,
  c.entry_fee,
  cp.id as pot_id,
  cp.platform_fee_percentage,
  cp.platform_fee_amount,
  cp.total_amount,
  cp.winners_pot,
  cp.status as pot_status
FROM challenges c
LEFT JOIN challenge_pots cp ON cp.challenge_id = c.id
WHERE c.title ILIKE '%smile%'
ORDER BY c.created_at DESC
LIMIT 5;

