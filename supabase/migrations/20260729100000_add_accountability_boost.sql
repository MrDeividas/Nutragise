-- Active double-points window for Accountability Boost
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS points_boost_expires_at timestamptz;

COMMENT ON COLUMN public.profiles.points_boost_expires_at IS
  'When set in the future, habit/core points are doubled until this timestamp';

-- Free Accountability Boost unlockable at Level 2 (claim once)
INSERT INTO public.store_items (
  id,
  name,
  description,
  price_tokens,
  level_required,
  is_pro_only,
  type
)
VALUES (
  'a1000000-0000-4000-8000-0000000000b1',
  'Accountability Boost',
  'Double all habit and action points for 2 days. Unlock and claim once you reach Level 2.',
  0,
  2,
  false,
  'accountability_boost'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_tokens = EXCLUDED.price_tokens,
  level_required = EXCLUDED.level_required,
  is_pro_only = EXCLUDED.is_pro_only,
  type = EXCLUDED.type;
