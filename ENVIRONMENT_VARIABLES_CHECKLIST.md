# Environment Variables Verification Checklist

## Required Environment Variables for Supabase Edge Functions

Use this checklist to verify all required environment variables are set in your Supabase project.

---

## How to Check Environment Variables

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Edge Functions** → **Secrets**
4. Verify each variable below is present

---

## Required Variables

### ✅ STRIPE_SECRET_KEY
- **Purpose**: Stripe API secret key for processing payments
- **Format**: `sk_test_...` (test) or `sk_live_...` (production)
- **Where to get it**: Stripe Dashboard → Developers → API keys → Secret key
- **Used by**: All payment-related edge functions
- **Status**: [ ] Set
- **Value starts with**: `sk_`

### ✅ STRIPE_WEBHOOK_SECRET
- **Purpose**: Webhook signing secret to verify Stripe webhook requests
- **Format**: `whsec_...`
- **Where to get it**: Stripe Dashboard → Developers → Webhooks → Click your webhook → Reveal signing secret
- **Used by**: `stripe-webhook` edge function
- **Status**: [ ] Set
- **Value starts with**: `whsec_`

### ✅ STRIPE_PRO_PRICE_ID
- **Purpose**: Stripe Price ID for Pro subscription (£15/month)
- **Format**: `price_...`
- **Where to get it**: Stripe Dashboard → Products → Your Pro product → Pricing → Price ID
- **Used by**: `create-subscription-payment-sheet` edge function
- **Status**: [ ] Set
- **Value starts with**: `price_`

### ✅ SUPABASE_URL
- **Purpose**: Your Supabase project URL
- **Format**: `https://[PROJECT_REF].supabase.co`
- **Where to get it**: Supabase Dashboard → Settings → API → Project URL
- **Used by**: All edge functions
- **Status**: [ ] Set
- **Example**: `https://gtnjrauujrzkesaulius.supabase.co`

### ✅ SUPABASE_SERVICE_ROLE_KEY
- **Purpose**: Service role key for admin operations (bypasses RLS)
- **Format**: Long JWT token
- **Where to get it**: Supabase Dashboard → Settings → API → service_role key
- **Used by**: Edge functions that need admin access
- **Status**: [ ] Set
- **⚠️ WARNING**: Keep this secret! Never expose in client code.

### ✅ SUPABASE_ANON_KEY
- **Purpose**: Anonymous key for client-side operations
- **Format**: Long JWT token
- **Where to get it**: Supabase Dashboard → Settings → API → anon public key
- **Used by**: Edge functions for JWT validation
- **Status**: [ ] Set
- **Note**: This is safe to use in client code

---

## Edge Functions That Need These Variables

### create-payment-intent
- ✅ STRIPE_SECRET_KEY
- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY

### create-challenge-payment
- ✅ STRIPE_SECRET_KEY
- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY

### create-subscription-payment-sheet
- ✅ STRIPE_SECRET_KEY
- ✅ STRIPE_PRO_PRICE_ID
- ✅ SUPABASE_URL
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ SUPABASE_ANON_KEY

### stripe-webhook
- ✅ STRIPE_SECRET_KEY
- ✅ STRIPE_WEBHOOK_SECRET
- ✅ SUPABASE_URL
- ✅ SUPABASE_SERVICE_ROLE_KEY

### get-customer-portal
- ✅ STRIPE_SECRET_KEY
- ✅ SUPABASE_URL
- ✅ SUPABASE_SERVICE_ROLE_KEY

---

## Verification Steps

1. [ ] Open Supabase Dashboard → Settings → Edge Functions → Secrets
2. [ ] Check that all 6 required variables are listed
3. [ ] Verify each variable has a value (not empty)
4. [ ] For STRIPE_SECRET_KEY: Check if it's test (`sk_test_`) or live (`sk_live_`)
5. [ ] For STRIPE_WEBHOOK_SECRET: Verify it matches the secret in Stripe Dashboard
6. [ ] For STRIPE_PRO_PRICE_ID: Verify the price exists in Stripe Dashboard

---

## Common Issues

### Issue: Variable not found
**Solution**: Click "Add secret" and add the missing variable

### Issue: Wrong value format
**Solution**: 
- STRIPE_SECRET_KEY should start with `sk_test_` or `sk_live_`
- STRIPE_WEBHOOK_SECRET should start with `whsec_`
- STRIPE_PRO_PRICE_ID should start with `price_`

### Issue: Variable exists but edge function still errors
**Solution**: 
- Redeploy the edge function after adding/updating secrets
- Run: `supabase functions deploy [function-name]`

---

## Next Steps After Verification

1. ✅ All variables verified → Proceed to webhook verification (config-2)
2. ❌ Missing variables → Add them in Supabase Dashboard
3. ⚠️ Test keys found → Switch to live keys before production (config-3)

---

**Last Updated**: After security fixes implementation
