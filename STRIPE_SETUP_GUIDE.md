# Stripe Setup Guide for Challenge Payments

## Overview
This guide walks you through setting up Stripe for challenge payments with escrow functionality.

## Prerequisites
- Stripe account (sign up at https://stripe.com)
- Supabase project with Edge Functions enabled

---

## Step 1: Stripe Dashboard Setup

### 1.1 Get Your API Keys

1. **Log in to Stripe Dashboard**: https://dashboard.stripe.com
2. **Go to Developers → API keys**
3. **Copy your keys:**
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

⚠️ **Important**: 
- Use **test keys** (`pk_test_`, `sk_test_`) for development
- Use **live keys** (`pk_live_`, `sk_live_`) for production

### 1.2 Set Up Webhooks

1. **Go to Developers → Webhooks**
2. **Click "Add endpoint"**
3. **Endpoint URL**: `https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/stripe-webhook`
4. **Events to send**: Select these events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `transfer.created`
   - `transfer.paid`
5. **Click "Add endpoint"**
6. **Copy the "Signing secret"** (starts with `whsec_`)

### 1.3 Enable Payment Methods

1. **Go to Settings → Payment methods**
2. **Enable the payment methods you want:**
   - ✅ Cards (required)
   - ✅ Apple Pay (optional, for iOS)
   - ✅ Google Pay (optional, for Android)
   - ✅ Other methods as needed

### 1.4 (Optional) Set Up Stripe Connect

If you want to transfer winnings directly to user bank accounts:

1. **Go to Connect → Get started**
2. **Choose Connect type**: 
   - **Express accounts** (recommended for simplicity)
   - **Standard accounts** (more control, more setup)
3. **Follow Stripe's onboarding flow**
4. **Note**: This is optional - current implementation adds winnings to wallet

---

## Step 2: Supabase Environment Variables

### 2.1 Add Secrets to Supabase

1. **Go to your Supabase Dashboard**
2. **Navigate to Project Settings → Edge Functions**
3. **Add these secrets:**

```
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_...
```

**How to add:**
- Click "Add new secret"
- Name: `STRIPE_SECRET_KEY`
- Value: Your Stripe secret key
- Click "Add secret"
- Repeat for `STRIPE_WEBHOOK_SECRET`

### 2.2 Update Your .env File (Local Development)

Add to your `.env` file:

```env
STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
```

---

## Step 3: Deploy Edge Functions

### 3.1 Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

### 3.2 Login to Supabase

```bash
supabase login
```

### 3.3 Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 3.4 Deploy Functions

```bash
# Deploy all functions
supabase functions deploy create-challenge-payment
supabase functions deploy refund-challenge-payment
supabase functions deploy transfer-challenge-winnings

# Or deploy all at once
supabase functions deploy
```

---

## Step 4: Run Database Migration

### 4.1 Execute SQL Migration

1. **Go to Supabase Dashboard → SQL Editor**
2. **Run the migration:**

```sql
-- See: supabase/add_stripe_payment_intent_to_participants.sql
ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_challenge_participants_stripe_payment_intent 
ON challenge_participants(stripe_payment_intent_id);
```

Or use Supabase CLI:

```bash
supabase db push
```

---

## Step 5: Test the Integration

### 5.1 Test Cards (Stripe Test Mode)

Use these test cards in your app:

| Card Number | Description |
|------------|-------------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |

**Other test details:**
- **Expiry**: Any future date (e.g., `12/25`)
- **CVC**: Any 3 digits (e.g., `123`)
- **ZIP**: Any 5 digits (e.g., `12345`)

### 5.2 Test Flow

1. **Create a test challenge** with entry fee (e.g., £10)
2. **Join the challenge** using test card `4242 4242 4242 4242`
3. **Check Stripe Dashboard** → Payments → You should see the Payment Intent
4. **Leave the challenge** (before it starts)
5. **Check Stripe Dashboard** → Payments → You should see the refund

### 5.3 Verify in Stripe Dashboard

**What you should see:**
- ✅ Payment Intents for each challenge join
- ✅ Payment status: `succeeded`
- ✅ Refunds when users leave
- ✅ All transactions in one place

---

## Step 6: Production Checklist

Before going live:

- [ ] Switch to **live API keys** (`pk_live_`, `sk_live_`)
- [ ] Update webhook endpoint to production URL
- [ ] Update webhook signing secret
- [ ] Test with real card (small amount)
- [ ] Set up Stripe email notifications
- [ ] Configure chargeback handling
- [ ] Set up fraud prevention rules
- [ ] Review Stripe's compliance requirements
- [ ] Set up payout schedule (if using Connect)

---

## Troubleshooting

### Payment Sheet Not Showing

**Issue**: Payment sheet doesn't appear

**Solutions:**
1. Check `STRIPE_PUBLISHABLE_KEY` is set in `.env`
2. Verify Stripe Provider is wrapping your app (see `App.tsx`)
3. Check console for errors
4. Ensure you're using test keys in test mode

### Webhook Not Receiving Events

**Issue**: Webhook events not being received

**Solutions:**
1. Verify webhook URL is correct
2. Check webhook signing secret matches
3. Test webhook in Stripe Dashboard → Webhooks → Send test webhook
4. Check Supabase Edge Function logs

### Payment Intent Creation Fails

**Issue**: Error creating payment intent

**Solutions:**
1. Verify `STRIPE_SECRET_KEY` is set in Supabase secrets
2. Check Edge Function logs in Supabase Dashboard
3. Ensure amount is at least £0.50 (50 pence)
4. Verify currency is `gbp`

### Refund Fails

**Issue**: Refund not processing

**Solutions:**
1. Check payment intent status (must be `succeeded`)
2. Verify payment intent ID is stored in database
3. Check Stripe Dashboard for refund status
4. Review Edge Function logs

---

## Security Best Practices

1. **Never commit API keys** to git
2. **Use environment variables** for all keys
3. **Rotate keys** regularly
4. **Use test mode** for development
5. **Enable 3D Secure** for high-value transactions
6. **Monitor for fraud** in Stripe Dashboard
7. **Set up alerts** for failed payments

---

## Support Resources

- **Stripe Docs**: https://stripe.com/docs
- **Stripe Connect**: https://stripe.com/docs/connect
- **Stripe Testing**: https://stripe.com/docs/testing
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions

---

## Next Steps

After setup is complete:

1. ✅ Test joining a challenge
2. ✅ Test leaving a challenge (refund)
3. ✅ Test challenge completion (winnings transfer)
4. ✅ Monitor Stripe Dashboard for transactions
5. ✅ Set up production keys when ready

---

## Quick Reference

### Environment Variables Needed

**Supabase Secrets:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

**App .env:**
- `STRIPE_PUBLISHABLE_KEY`

### Edge Functions to Deploy

1. `create-challenge-payment`
2. `refund-challenge-payment`
3. `transfer-challenge-winnings`
4. `stripe-webhook` (already exists)

### Database Changes

- Add `stripe_payment_intent_id` column to `challenge_participants`

---

## Summary

**What you need to do on Stripe's end:**

1. ✅ Get API keys (publishable + secret)
2. ✅ Set up webhook endpoint
3. ✅ Copy webhook signing secret
4. ✅ Enable payment methods
5. ✅ (Optional) Set up Stripe Connect for direct transfers

**That's it!** The rest is handled by the code we've implemented.

