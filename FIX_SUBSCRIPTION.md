# Quick Fix: Sync Subscription Status

Since you have 2 active subscriptions in Stripe but the app isn't showing Pro, here's how to fix it:

## Option 1: Use the Sync Function (Recommended)

I've created a sync function that will pull subscription status from Stripe and update your database.

### Step 1: Deploy the Sync Function

```bash
cd /Users/mac/Documents/nutrapp\ Test\ design
supabase functions deploy sync-subscription-status
```

### Step 2: Get Your User ID

Run this SQL query in Supabase SQL Editor to find your user ID:

```sql
SELECT id, username, email, stripe_customer_id 
FROM profiles 
WHERE username = 'deividasg21' OR username LIKE '%deividasg%';
```

### Step 3: Call the Sync Function

You can call it from your app code, or use this curl command (replace `YOUR_USER_ID` and `YOUR_SUPABASE_URL`):

```bash
curl -X POST https://YOUR_SUPABASE_URL/functions/v1/sync-subscription-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"userId": "YOUR_USER_ID"}'
```

Or add a button in your app to trigger it manually.

## Option 2: Manual SQL Fix (Quick Fix)

If you want to fix it immediately:

1. **Get subscription info from Stripe Dashboard:**
   - Go to Stripe Dashboard → Customers
   - Find your account (search by email)
   - Copy the Customer ID (starts with `cus_`)
   - Go to Subscriptions tab
   - Copy the Subscription ID (starts with `sub_`)
   - Note the "Current period end" date

2. **Run this SQL in Supabase SQL Editor:**

```sql
-- Replace the values below with actual values from Stripe
UPDATE profiles
SET 
  is_pro = true,
  subscription_status = 'active',
  stripe_subscription_id = 'sub_xxxxx', -- Your subscription ID from Stripe
  subscription_current_period_end = '2025-02-15T00:00:00Z'::timestamp -- Your period end date
WHERE username = 'deividasg21' OR username LIKE '%deividasg%';
```

3. **Verify it worked:**

```sql
SELECT 
  id,
  username,
  is_pro,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status,
  subscription_current_period_end
FROM profiles
WHERE username = 'deividasg21' OR username LIKE '%deividasg%';
```

## Option 3: Fix Webhook (Long-term Solution)

The webhook should automatically update `is_pro` when subscriptions change. To fix it:

1. **Check if webhook is receiving events:**
   - Go to Stripe Dashboard → Webhooks
   - Click on your webhook
   - Check "Recent deliveries" for events around the time you upgraded
   - Look for `customer.subscription.created` or `customer.subscription.updated` events

2. **If webhook is failing, check:**
   - Webhook secret matches in Supabase environment variables
   - Webhook URL is correct
   - Edge function `stripe-webhook` is deployed
   - Check Supabase function logs for errors

3. **Common issue:** The webhook looks up users by `stripe_customer_id`. If your profile doesn't have this set, the webhook can't find you.

   **Fix:** Make sure `stripe_customer_id` is set in your profile:
   ```sql
   -- Get customer ID from Stripe Dashboard, then:
   UPDATE profiles
   SET stripe_customer_id = 'cus_xxxxx' -- Your customer ID from Stripe
   WHERE username = 'deividasg21';
   ```

## Why This Happened

The webhook handler looks up users by `stripe_customer_id`:
```typescript
.eq("stripe_customer_id", customerId)
```

If your profile doesn't have `stripe_customer_id` set, or it doesn't match the customer ID in Stripe, the webhook can't find your account to update it.

## After Fixing

1. **Refresh the app** - The app should now show Pro features
2. **Check Pro features work:**
   - Insights screen should be accessible
   - Raffles should be accessible
   - Pro challenges should be visible

## Prevent Future Issues

The new `UpgradeToProModal` now automatically syncs subscription status after payment, so this should prevent the issue for future upgrades.

