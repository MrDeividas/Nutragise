-- Core habits + Everyone Can Play: £15; Pro challenges: £25
-- Only update active challenges with no participants (avoid breaking pots already funded).

UPDATE public.challenges c
SET entry_fee = 15
WHERE COALESCE(c.is_pro_only, false) = false
  AND c.entry_fee = 10
  AND c.status = 'active'
  AND NOT EXISTS (
    SELECT 1
    FROM public.challenge_participants cp
    WHERE cp.challenge_id = c.id
  );

UPDATE public.challenges c
SET entry_fee = 25
WHERE COALESCE(c.is_pro_only, false) = true
  AND c.entry_fee > 0
  AND c.entry_fee <> 25
  AND c.status = 'active'
  AND NOT EXISTS (
    SELECT 1
    FROM public.challenge_participants cp
    WHERE cp.challenge_id = c.id
  );
