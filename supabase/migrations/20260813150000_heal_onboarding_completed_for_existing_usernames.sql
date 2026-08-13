-- Heal existing accounts that already have a real username but never got onboarding_completed=true
UPDATE public.profiles
SET onboarding_completed = true
WHERE onboarding_completed IS NOT TRUE
  AND username IS NOT NULL
  AND btrim(username) <> ''
  AND username !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND id::text <> username;
