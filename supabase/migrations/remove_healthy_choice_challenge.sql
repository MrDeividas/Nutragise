-- Retire curated "Healthy Choice" challenge (overlaps No Junk Food).
-- Deletes all instances (recurring weeks share title) and dependent rows.
-- Run after active holds/settlements are resolved if any paid instance exists.
--
-- Skips cleanly if public.challenges does not exist (wrong DB, schema not migrated yet).

DO $$
DECLARE
  cid UUID;
BEGIN
  IF to_regclass('public.challenges') IS NULL THEN
    RAISE NOTICE 'remove_healthy_choice_challenge: public.challenges missing — skipping (apply base schema / use correct database).';
    RETURN;
  END IF;

  -- Match "Healthy Choice", "Healthy Choice Challenge", stray emoji, etc.
  FOR cid IN
    SELECT id FROM public.challenges
    WHERE lower(
      trim(
        regexp_replace(
          trim(regexp_replace(trim(title), E'😊', '', 'g')),
          '[[:space:]]+challenge$',
          '',
          'i'
        )
      )
    ) = 'healthy choice'
  LOOP
    DELETE FROM public.challenge_submissions WHERE challenge_id = cid;
    DELETE FROM public.daily_proof_tracking WHERE challenge_id = cid;
    DELETE FROM public.challenge_pots WHERE challenge_id = cid;
    DELETE FROM public.challenge_participants WHERE challenge_id = cid;
    DELETE FROM public.challenge_requirements WHERE challenge_id = cid;
    UPDATE public.wallet_transactions SET challenge_id = NULL WHERE challenge_id = cid;
    DELETE FROM public.challenges WHERE id = cid;
  END LOOP;
END $$;
