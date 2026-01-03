# Automatic Challenge Review Setup

## Problem
The "10 sit ups" challenge (and others) don't automatically go for review when they end. You have to visit the Admin Review screen for them to be processed.

## Solution
Set up automatic checking using PostgreSQL's `pg_cron` extension to run every hour.

---

## Setup Steps

### Step 1: Deploy the Edge Function

First, login to Supabase CLI:

```bash
supabase login
```

Then deploy the function:

```bash
cd "/Users/mac/Documents/nutrapp Test design"
supabase functions deploy check-ended-challenges
```

### Step 2: Enable pg_cron in Supabase Dashboard

1. Go to https://supabase.com/dashboard/project/gtnjrauujrzkesaulius
2. Navigate to **Database** → **Extensions**
3. Search for `pg_cron`
4. Click **Enable** on pg_cron

### Step 3: Run the Migration

Go to **SQL Editor** in your Supabase Dashboard and run the migration file:

```bash
# Copy the contents of supabase/migrations/setup_automatic_challenge_review.sql
# Paste and run it in the SQL Editor
```

Or run it via command line (if you have Supabase CLI set up locally):

```bash
supabase db push
```

---

## What This Does

1. **Creates a database function**: `check_and_update_ended_challenges()`
   - Finds all challenges where `end_date < NOW()` and `approval_status IS NULL`
   - Updates them to `approval_status = 'pending'` and `status = 'completed'`

2. **Schedules automatic execution**: Runs every hour at minute 0
   - 00:00, 01:00, 02:00, etc.
   - No one needs to visit the Admin Review screen

3. **Provides monitoring tools**: SQL queries to check job status

---

## Testing

### Test the function manually:

```sql
SELECT check_and_update_ended_challenges();
```

### Check if the cron job is scheduled:

```sql
SELECT * FROM cron.job WHERE jobname = 'check-ended-challenges-hourly';
```

### View recent job runs:

```sql
SELECT * 
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'check-ended-challenges-hourly')
ORDER BY start_time DESC 
LIMIT 10;
```

---

## How It Works

**Before:**
- Challenges end → Nothing happens
- Admin visits Review screen → Function runs manually → Challenges marked for review

**After:**
- Challenges end → Cron job runs hourly → Automatically marked for review
- Admin visits Review screen → Sees pending challenges immediately

---

## Monitoring

### Check logs:

```sql
-- View recent executions
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;

-- View only errors
SELECT * FROM cron.job_run_details 
WHERE status = 'failed'
ORDER BY start_time DESC;
```

---

## Customizing the Schedule

To change how often it runs, update the cron schedule:

```sql
-- Every 30 minutes
SELECT cron.schedule(
  'check-ended-challenges-hourly',
  '*/30 * * * *',
  'SELECT check_and_update_ended_challenges();'
);

-- Every 6 hours
SELECT cron.schedule(
  'check-ended-challenges-hourly',
  '0 */6 * * *',
  'SELECT check_and_update_ended_challenges();'
);

-- Daily at midnight
SELECT cron.schedule(
  'check-ended-challenges-hourly',
  '0 0 * * *',
  'SELECT check_and_update_ended_challenges();'
);
```

---

## Troubleshooting

### If the job isn't running:

1. Check if pg_cron is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Check if the job exists:
   ```sql
   SELECT * FROM cron.job;
   ```

3. Check for errors:
   ```sql
   SELECT * FROM cron.job_run_details WHERE status = 'failed';
   ```

### To disable the cron job:

```sql
SELECT cron.unschedule('check-ended-challenges-hourly');
```

### To re-enable:

Just run the migration again or:

```sql
SELECT cron.schedule(
  'check-ended-challenges-hourly',
  '0 * * * *',
  'SELECT check_and_update_ended_challenges();'
);
```

---

## Summary

✅ Created Edge Function for external cron services (optional)  
✅ Created database function for pg_cron (recommended)  
✅ Set up hourly automatic checking  
✅ No manual intervention needed  
✅ All ended challenges automatically go to review  

The "10 sit ups" challenge (and all future challenges) will now automatically appear in the Admin Review screen within 1 hour of ending.

