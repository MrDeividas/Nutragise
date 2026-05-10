-- Replace "Daily Walk Proof" with "Spread Positivity" (new theme + proof rules).
--
-- Requires your Nutrapp schema (public.challenges). If you see "relation challenges does not exist",
-- you are on the wrong database or schema has not been created yet — use the Supabase project your app uses.

DO $$
BEGIN
  IF to_regclass('public.challenges') IS NULL THEN
    RAISE NOTICE 'rename_daily_walk_proof_to_spread_positivity: public.challenges missing — skipping (wrong DB or schema not migrated).';
    RETURN;
  END IF;

  -- Match exact title, "Daily Walk Proof Challenge", odd spacing, etc.
  UPDATE public.challenges
  SET
    title = 'Spread Positivity',
    description = 'Each day, spread something genuinely positive in the real world or online. Examples: post something kind or uplifting on social media; share an encouraging story, reel, or comment; send a supportive message to a friend or family member; compliment someone; check in on someone who might need it; or do another clear act of goodwill toward another person. Your requirement is to take a photo that shows what you did—for instance your post or story on screen (you can blur or crop private details), your kind DM or text conversation, or a photo of the moment if everyone pictured is okay with it. Upload that picture each day as proof. Seven days of proof are required to pass.',
    category = 'wellness'
  WHERE lower(trim(regexp_replace(trim(title), '[[:space:]]+challenge$', '', 'i'))) = 'daily walk proof';

  UPDATE public.challenge_requirements cr
  SET requirement_text = 'Each day, take a photo that shows you spreading positivity—such as a kind social post or story, a supportive message to a friend or someone else, or another clear positive act—and upload it. 7 days required to pass.'
  FROM public.challenges c
  WHERE cr.challenge_id = c.id AND c.title = 'Spread Positivity';
END $$;
