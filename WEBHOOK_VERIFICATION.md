# Stripe Webhook Configuration Verification Guide

This guide will help you verify that your Stripe webhook is properly configured to update Pro subscription status.

## 🔍 Step 1: Check Webhook Endpoint in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Look for a webhook endpoint pointing to your Supabase function
3. The endpoint URL should be:
   ```
   https://[YOUR_PROJECT_REF].supabase.co/functions/v1/stripe-webhook
   ```
   Replace `[YOUR_PROJECT_REF]` with your actual Supabase project reference

## 📋 Step 2: Verify Webhook Events

The webhook should be listening for these events:
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.paid`
- ✅ `invoice.payment_failed`

**To check:**
1. In Stripe Dashboard → Webhooks → Click on your webhook
2. Scroll to "Events to send"
3. Make sure all 5 events above are selected

## 🔑 Step 3: Verify Webhook Secret

1. In Stripe Dashboard → Webhooks → Click on your webhook
2. Click "Reveal" next to "Signing secret"
3. Copy the webhook secret (starts with `whsec_...`)
4. Go to Supabase Dashboard → **Project Settings** → **Edge Functions** → **Environment Variables**
5. Check if `STRIPE_WEBHOOK_SECRET` is set with the value from step 3
6. Make sure it matches exactly (no extra spaces or characters)

## 🧪 Step 4: Test Webhook Delivery

1. In Stripe Dashboard → Webhooks → Click on your webhook
2. Scroll to "Recent deliveries"
3. Look for recent events (especially around the time deividasg upgraded)
4. Check the status:
   - ✅ **Succeeded** (200) = Webhook received and processed
   - ❌ **Failed** = Check the error message
   - ⏳ **Pending** = Webhook not yet delivered

## 🔍 Step 5: Check Webhook Logs

1. In Stripe Dashboard → Webhooks → Click on your webhook
2. Click on a recent event delivery
3. Check:
   - **Request**: See what data was sent
   - **Response**: See what your function returned
   - **Response status**: Should be 200

## 🐛 Common Issues

### Issue 1: Webhook Not Receiving Events
**Symptoms:** No events in "Recent deliveries"
**Fix:** 
- Verify webhook URL is correct
- Check if webhook is enabled (not paused)
- Make sure you're checking the correct Stripe mode (test vs live)

### Issue 2: Webhook Receiving Events But Failing
**Symptoms:** Events show "Failed" status
**Possible causes:**
- Webhook secret mismatch
- Function not deployed
- Database permissions issue
- Missing environment variables

### Issue 3: Webhook Succeeds But Database Not Updated
**Symptoms:** Webhook shows 200 but `is_pro` is still false
**Possible causes:**
- User not found by `stripe_customer_id`
- Database update failed silently
- RLS policies blocking update

## 🔧 Quick Fix: Manual Sync

If webhook is not working, you can manually sync the subscription:

1. **Option A: Use the new sync function** (after deploying)
   - The app will automatically sync after payment
   - Or call `stripeService.syncSubscriptionStatus(userId)` from code

2. **Option B: Manual SQL update** (temporary fix)
   ```sql
   -- First, get the Stripe customer ID from Stripe Dashboard
   -- Then update the profile:
   UPDATE profiles
   SET is_pro = true,
       subscription_status = 'active',
       subscription_current_period_end = '2025-02-01T00:00:00Z' -- Set to actual end date
   WHERE stripe_customer_id = 'cus_xxxxx'; -- Replace with actual customer ID
   ```

## 📝 Verification Checklist

- [ ] Webhook endpoint exists in Stripe Dashboard
- [ ] Webhook URL points to correct Supabase function
- [ ] All 5 required events are selected
- [ ] Webhook secret is set in Supabase environment variables
- [ ] Webhook secret matches the one in Stripe Dashboard
- [ ] Recent webhook deliveries show "Succeeded" status
- [ ] Edge Function `stripe-webhook` is deployed
- [ ] Environment variables are set:
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`

## 🚀 Next Steps

1. Run the diagnostic SQL query: `supabase/check_deividasg_pro_status.sql`
2. Check Stripe Dashboard for the subscription
3. Verify webhook configuration using steps above
4. Deploy the new `sync-subscription-status` function
5. Test the upgrade flow again

