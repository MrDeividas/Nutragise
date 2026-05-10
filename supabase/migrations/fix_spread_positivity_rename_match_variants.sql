-- Fix Spread Positivity rename when the title in DB is not exactly 'Daily Walk Proof'
-- (e.g. "Daily Walk Proof Challenge", extra spaces). Safe to run multiple times.
--
-- If your project already applied rename_daily_walk_proof_to_spread_positivity.sql with 0 rows
-- updated, apply this migration (or run once in SQL Editor).

DO $$
DECLARE
  updated_challenges int;
BEGIN
  IF to_regclass('public.challenges') IS NULL THEN
    RAISE NOTICE 'fix_spread_positivity_rename_match_variants: public.challenges missing — skip';
    RETURN;
  END IF;

  UPDATE public.challenges
  SET
    title = 'Spread Positivity',
    description = 'Each day, spread something genuinely positive in the real world or online. Examples: post something kind or uplifting on social media; share an encouraging story, reel, or comment; send a supportive message to a friend or family member; compliment someone; check in on someone who might need it; or do another clear act of goodwill toward another person. Your requirement is to take a photo that shows what you did—for instance your post or story on screen (you can blur or crop private details), your kind DM or text conversation, or a photo of the moment if everyone pictured is okay with it. Upload that picture each day as proof. Seven days of proof are required to pass.',
    category = 'wellness'
  WHERE lower(trim(regexp_replace(trim(title), '[[:space:]]+challenge$', '', 'i'))) = 'daily walk proof';

  GET DIAGNOSTICS updated_challenges = ROW_COUNT;
  RAISE NOTICE 'fix_spread_positivity_rename_match_variants: challenges rows updated = %', updated_challenges;

  UPDATE public.challenge_requirements cr
  SET requirement_text = 'Each day, take a photo that shows you spreading positivity—such as a kind social post or story, a supportive message to a friend or someone else, or another clear positive act—and upload it. 7 days required to pass.'
  FROM public.challenges c
  WHERE cr.challenge_id = c.id AND c.title = 'Spread Positivity';
END $$;
