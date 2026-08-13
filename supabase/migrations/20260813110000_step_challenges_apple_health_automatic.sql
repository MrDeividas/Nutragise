-- Step challenges can be verified via Apple Health (no photo required)
UPDATE public.challenges
SET verification_type = 'automatic'
WHERE coalesce(is_user_created, false) = false
  AND status IN ('active', 'upcoming')
  AND lower(title) LIKE '%step%'
  AND coalesce(verification_type, '') <> 'automatic';
