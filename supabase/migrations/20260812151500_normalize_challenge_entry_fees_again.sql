-- Stop £10 fees coming back: normalize all live system challenges again.
UPDATE public.challenges
SET is_pro_only = true, entry_fee = 25
WHERE coalesce(is_user_created, false) = false
  AND status IN ('active', 'upcoming')
  AND lower(regexp_replace(trim(title), '\s+challenge$', '', 'i')) IN (
    'daily sweat','6am club','15k steps daily','15k steps','reduce social media',
    '100 press ups','100 squats','mobility every day','deep work'
  )
  AND (coalesce(entry_fee,0) <> 25 OR coalesce(is_pro_only,false) = false);

UPDATE public.challenges
SET is_pro_only = false, entry_fee = 15
WHERE coalesce(is_user_created, false) = false
  AND status IN ('active', 'upcoming')
  AND coalesce(entry_fee, 0) > 0
  AND lower(regexp_replace(trim(title), '\s+challenge$', '', 'i')) NOT IN (
    'daily sweat','6am club','15k steps daily','15k steps','reduce social media',
    '100 press ups','100 squats','mobility every day','deep work'
  )
  AND coalesce(entry_fee,0) <> 15;
