-- Set platform fee to 30% for Daily Smile Challenge
-- This updates existing pots. New pots will automatically use 30% via code logic.

UPDATE challenge_pots
SET 
  platform_fee_percentage = 30.00,
  platform_fee_amount = total_amount * 0.30,
  winners_pot = total_amount * 0.70
WHERE challenge_id IN (
  SELECT id FROM challenges WHERE title ILIKE '%smile%'
)
RETURNING 
  id,
  challenge_id,
  platform_fee_percentage,
  platform_fee_amount,
  total_amount,
  winners_pot;

-- Note: The code has been updated to automatically use 30% platform fee
-- for any challenge with "smile" in the title when creating new pots.

