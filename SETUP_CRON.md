# Setting Up Automatic Challenge Review

## Overview
The `check-ended-challenges` Edge Function automatically marks ended challenges as "pending review" without requiring anyone to visit the Admin Review screen.

## Setup Instructions

### Step 1: Deploy the Edge Function

```bash
cd "/Users/mac/Documents/nutrapp Test design"
supabase functions deploy check-ended-challenges
```

### Step 2: Set Up Cron Job (Scheduled Execution)

You have two options:

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Extensions**
3. Enable the `pg_cron` extension
4. Go to **SQL Editor** and run:

```sql
-- Schedule the function to run every hour
SELECT cron.schedule(
  'check-ended-challenges-hourly',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT
    net.http_post(
      url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/check-ended-challenges',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SUPABASE_ANON_KEY"}'::jsonb
    ) as request_id;
  $$
);
```

**Replace:**
- `YOUR_PROJECT_REF` with your actual project reference (e.g., `gtnjrauujrzkesaulius`)
- `YOUR_SUPABASE_ANON_KEY` with your anon key from the API settings

#### Option B: Using an External Cron Service

Use a service like:
- **Cron-job.org** (free)
- **EasyCron** (free tier available)
- **GitHub Actions** (if you're using GitHub)

Set it to call:
```
POST https://gtnjrauujrzkesaulius.supabase.co/functions/v1/check-ended-challenges
```

Every hour with headers:
```
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json
```

### Step 3: Test the Function

Test manually first:

```bash
curl -i --location --request POST \
  'https://gtnjrauujrzkesaulius.supabase.co/functions/v1/check-ended-challenges' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json'
```

### Step 4: Verify It's Working

- Check the Edge Function logs in Supabase Dashboard
- Visit the Admin Review screen - ended challenges should appear automatically

## Cron Schedule Options

Common schedules:

- Every hour: `0 * * * *`
- Every 30 minutes: `*/30 * * * *`
- Every 6 hours: `0 */6 * * *`
- Daily at midnight: `0 0 * * *`
- Daily at 9 AM: `0 9 * * *`

## Monitoring

Check logs in:
- Supabase Dashboard → Edge Functions → check-ended-challenges → Logs
- Or run: `supabase functions logs check-ended-challenges`

## Removing the Old Manual Check (Optional)

Once the cron job is working, you can remove the manual check from `AdminReviewScreen.tsx` if desired, though keeping it as a backup doesn't hurt.

