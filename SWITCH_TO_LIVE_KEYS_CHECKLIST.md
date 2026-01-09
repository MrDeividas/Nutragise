# Switch to Live Stripe Keys Checklist

**⚠️ IMPORTANT**: Only switch to live keys when you're ready for production. Test keys should be used during development.

---

## Pre-Switch Checklist

Before switching to live keys, ensure:
- [ ] All payment flows tested with test keys
- [ ] Webhook is working correctly with test keys
- [ ] Edge functions are deployed and working
- [ ] You have a Stripe live account set up
- [ ] You understand the difference between test and live modes

---

## Step 1: Get Live Keys from Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. **Switch to Live mode** (toggle in top right)
3. Navigate to **Developers** → **API keys**
4. Copy the following:
   - [ ] **Publishable key** (starts with `pk_live_...`)
   - [ ] **Secret key** (starts with `sk_live_...`)

---

## Step 2: Update Supabase Edge Function Secrets

1. Go to Supabase Dashboard → **Settings** → **Edge Functions** → **Secrets**
2. Update `STRIPE_SECRET_KEY`:
   - [ ] Click on `STRIPE_SECRET_KEY`
   - [ ] Replace test key (`sk_test_...`) with live key (`sk_live_...`)
   - [ ] Save

---

## Step 3: Update App Environment Variables

Update your `.env` file (or app configuration):

1. [ ] Update `STRIPE_PUBLISHABLE_KEY`:
   - Change from `pk_test_...` to `pk_live_...`
   - Location: `.env` file in project root

2. [ ] Verify `STRIPE_SECRET_KEY` is NOT in `.env`:
   - Secret key should ONLY be in Supabase Edge Function secrets
   - Never commit secret keys to git

---

## Step 4: Update Stripe Webhook for Live Mode

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. **Switch to Live mode** (toggle in top right)
3. [ ] Create new webhook endpoint (or update existing):
   - URL: `https://[YOUR_PROJECT_REF].supabase.co/functions/v1/stripe-webhook`
   - Events: Same as test mode (see WEBHOOK_VERIFICATION.md)
4. [ ] Copy the new webhook signing secret (`whsec_...`)
5. [ ] Update `STRIPE_WEBHOOK_SECRET` in Supabase Edge Function secrets

---

## Step 5: Verify Live Price ID

1. In Stripe Dashboard (Live mode) → **Products**
2. [ ] Verify your Pro subscription product exists
3. [ ] Copy the **Price ID** (starts with `price_...`)
4. [ ] Update `STRIPE_PRO_PRICE_ID` in Supabase Edge Function secrets if different from test

---

## Step 6: Redeploy Edge Functions

After updating secrets, redeploy all payment-related functions:

```bash
# Redeploy all payment functions
supabase functions deploy create-payment-intent
supabase functions deploy create-challenge-payment
supabase functions deploy create-subscription-payment-sheet
supabase functions deploy stripe-webhook
supabase functions deploy get-customer-portal
```

- [ ] All functions deployed successfully

---

## Step 7: Test with Live Keys

⚠️ **WARNING**: Live keys process REAL payments. Test carefully!

1. [ ] Test wallet deposit (small amount, e.g., £1)
2. [ ] Test challenge payment (small amount)
3. [ ] Test subscription upgrade (verify it works)
4. [ ] Verify webhook receives events in live mode
5. [ ] Check that `is_pro` status updates correctly

---

## Step 8: Update App Configuration

If your app has separate configs for test/production:

1. [ ] Update production config to use live publishable key
2. [ ] Ensure test config still uses test keys (for development)
3. [ ] Verify app builds and runs with live keys

---

## Verification Checklist

After switching to live keys, verify:

- [ ] `STRIPE_SECRET_KEY` in Supabase starts with `sk_live_`
- [ ] `STRIPE_PUBLISHABLE_KEY` in app starts with `pk_live_`
- [ ] `STRIPE_WEBHOOK_SECRET` matches live webhook secret
- [ ] `STRIPE_PRO_PRICE_ID` is from live mode
- [ ] All edge functions redeployed
- [ ] Test payment succeeded (small amount)
- [ ] Webhook received and processed event
- [ ] Database updated correctly

---

## Rollback Plan

If something goes wrong, you can rollback:

1. Switch back to test keys in Supabase secrets
2. Update app `.env` to use test publishable key
3. Redeploy edge functions
4. Test with test keys to verify everything works

---

## Important Notes

- ⚠️ **Live keys process real money** - be careful!
- ⚠️ **Test thoroughly** before switching
- ⚠️ **Keep test keys** for development/staging
- ⚠️ **Never commit** live secret keys to git
- ✅ **Use environment variables** for all keys
- ✅ **Monitor Stripe Dashboard** for any issues

---

**Status**: [ ] Not Started | [ ] In Progress | [ ] Completed

**Date Completed**: _______________
