-- Setup automatic challenge review using pg_cron
-- This will automatically mark ended challenges as pending review every hour

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Drop the job if it already exists (safely handle if it doesn't exist)
DO $$
BEGIN
  PERFORM cron.unschedule('check-ended-challenges-hourly');
EXCEPTION
  WHEN OTHERS THEN
    -- Job doesn't exist, that's fine
    NULL;
END $$;

-- Create a function to check and update ended challenges
CREATE OR REPLACE FUNCTION check_and_update_ended_challenges()
RETURNS void AS $$
DECLARE
  challenge_record RECORD;
  update_count INTEGER := 0;
BEGIN
  -- Log start
  RAISE NOTICE '🔍 Checking for ended challenges at %', NOW();

  -- Find and update challenges that have ended but don't have approval_status set
  -- Add 1 hour grace period to prevent marking daily challenges immediately at midnight
  FOR challenge_record IN
    SELECT id, title, end_date, status
    FROM challenges
    WHERE end_date < (NOW() - INTERVAL '1 hour')
      AND approval_status IS NULL
      AND status IN ('upcoming', 'active', 'completed')
  LOOP
    -- Update challenge to pending review
    UPDATE challenges
    SET 
      approval_status = 'pending',
      status = 'completed'
    WHERE id = challenge_record.id;

    update_count := update_count + 1;
    RAISE NOTICE '✅ Marked challenge % (%) as pending review', challenge_record.title, challenge_record.id;
  END LOOP;

  IF update_count = 0 THEN
    RAISE NOTICE '✅ No challenges need to be marked for review';
  ELSE
    RAISE NOTICE '✅ Updated % challenge(s) to pending review', update_count;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the function to run every hour at minute 0
SELECT cron.schedule(
  'check-ended-challenges-hourly',
  '0 * * * *', -- Every hour at minute 0 (00:00, 01:00, 02:00, etc.)
  'SELECT check_and_update_ended_challenges();'
);

-- Verify the cron job was created
SELECT 
  jobid, 
  schedule, 
  command, 
  nodename, 
  nodeport, 
  database, 
  username,
  active
FROM cron.job
WHERE jobname = 'check-ended-challenges-hourly';

-- Show message
DO $$
BEGIN
  RAISE NOTICE '✅ Automatic challenge review is now set up!';
  RAISE NOTICE '   Runs every hour to check for ended challenges';
  RAISE NOTICE '   To manually trigger: SELECT check_and_update_ended_challenges();';
  RAISE NOTICE '   To view scheduled jobs: SELECT * FROM cron.job;';
  RAISE NOTICE '   To view job runs: SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;';
END $$;

