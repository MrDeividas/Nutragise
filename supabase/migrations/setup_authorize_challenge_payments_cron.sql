-- Register authorize-challenge-payments as an hourly cron job.
-- This places card holds for participants who saved their card when joining a 7-day challenge.
-- It runs via the Edge Function so it has access to the Stripe secret key.
-- Note: pg_cron is pre-installed on Supabase — no need to CREATE EXTENSION here.

-- Remove existing job if it exists
DO $$
BEGIN
  PERFORM cron.unschedule('authorize-challenge-payments-hourly');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Schedule the Edge Function call every hour at minute 30 (offset from check-ended-challenges)
-- Edge Function URL: https://<project_ref>.supabase.co/functions/v1/authorize-challenge-payments
-- Note: Replace <project_ref> with your actual Supabase project ref (gtnjrauujrzkesaulius)
SELECT cron.schedule(
  'authorize-challenge-payments-hourly',
  '30 * * * *', -- Every hour at :30 (e.g. 00:30, 01:30, ...)
  $$
  SELECT net.http_post(
    url := 'https://gtnjrauujrzkesaulius.supabase.co/functions/v1/authorize-challenge-payments',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' ||
               current_setting('app.service_role_key', true) || '"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Also schedule check-ended-challenges to call the Edge Function (replacing the DB-only version)
-- This ensures payment settlement runs via Edge Function (which has access to Stripe)
DO $$
BEGIN
  PERFORM cron.unschedule('check-ended-challenges-edge-hourly');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'check-ended-challenges-edge-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://gtnjrauujrzkesaulius.supabase.co/functions/v1/check-ended-challenges',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' ||
               current_setting('app.service_role_key', true) || '"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- Verify jobs
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname IN (
  'authorize-challenge-payments-hourly',
  'check-ended-challenges-edge-hourly'
);

DO $$
BEGIN
  RAISE NOTICE '✅ Cron jobs registered:';
  RAISE NOTICE '   authorize-challenge-payments-hourly — every hour at :30';
  RAISE NOTICE '   check-ended-challenges-edge-hourly  — every hour at :00';
END $$;
