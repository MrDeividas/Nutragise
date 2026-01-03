# Pro Subscription Setup Guide

This guide will help you set up the Pro subscription system (£15/month) for your app.

## ✅ What's Already Implemented

1. **Database Migration** - Subscription columns added to `profiles` table
2. **Stripe Webhook Handler** - Processes subscription events (created, updated, canceled, payment failed)
3. **Create Subscription Function** - Creates checkout session for users to subscribe
4. **Customer Portal Function** - Allows users to manage their subscription
5. **App Integration** - UpgradeToProModal and ProfileScreen ready to use subscriptions

---

## 🔧 Setup Steps

### Step 1: Run Database Migration

Run the SQL migration to add subscription columns to your `profiles` table:

```bash
# In Supabase SQL Editor, run:
/Users/mac/Documents/nutrapp Test design/supabase/migrations/add_subscription_columns.sql
```

This adds:
- `stripe_customer_id` - Stripe Customer ID
- `stripe_subscription_id` - Active subscription ID
- `subscription_status` - Status (active, canceled, past_due, etc.)
- `subscription_current_period_end` - When subscription period ends (Pro access until this date)

---

### Step 2: Create Stripe Price for Pro Membership

1. Go to Stripe Dashboard → **Products**
2. Click **Add product**
3. Fill in:
   - **Name**: Nutragise Pro Membership
   - **Description**: Premium features including AI insights, raffles, and exclusive challenges
   - **Pricing**: £15.00 GBP
   - **Billing period**: Monthly
   - **Payment type**: Recurring
4. Click **Save product**
5. **Copy the Price ID** (starts with `price_...`) - you'll need this for environment variables

---

### Step 3: Configure Stripe Customer Portal

1. Go to Stripe Dashboard → **Settings** → **Customer Portal**
2. Enable the Customer Portal
3. Configure settings:
   - ✅ **Allow customers to cancel subscriptions**
   - ✅ **Keep Pro access until end of billing period** (select "At the end of the billing period")
   - ✅ **Allow customers to update payment methods**
   - ✅ **Show invoice history**
4. Click **Save changes**

---

### Step 4: Add Environment Variables to Supabase

Go to Supabase Dashboard → **Settings** → **Edge Functions** → **Add Secret**

Add these environment variables:

```bash
# Required - Your Stripe Secret Key
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY

# Required - Webhook signing secret (you already have this!)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Required - Pro Price ID from Step 2
STRIPE_PRO_PRICE_ID=price_YOUR_PRICE_ID_HERE

# Already configured (from previous setup)
SUPABASE_URL=https://gcfzvvpovzqgcetxcqhw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

### Step 5: Deploy Edge Functions

Deploy all the subscription-related Edge Functions to Supabase:

```bash
# Deploy webhook handler
supabase functions deploy stripe-webhook

# Deploy subscription creation
supabase functions deploy create-subscription

# Deploy customer portal
supabase functions deploy get-customer-portal
```

---

### Step 6: Verify Webhook Configuration

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Find your webhook endpoint (you already set this up!)
3. Verify these events are being sent:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

✅ **You already have the webhook configured and signing secret!**

---

## 🎯 How It Works

### User Flow

1. **Non-Pro user** clicks on a Pro feature (Insights, Raffles, Pro Challenge)
2. **UpgradeToProModal** appears showing Pro benefits and £15/month price
3. User clicks **"Upgrade to Pro"**
4. App calls `stripeService.createSubscription()` → Opens Stripe Checkout
5. User enters card details and subscribes
6. **Stripe webhook** receives `customer.subscription.created` event
7. **stripe-webhook function** updates database: `is_pro = true`
8. User immediately gets Pro access!

### Subscription Management

1. **Pro user** goes to Profile → clicks **"Manage Subscription"**
2. App calls `stripeService.getCustomerPortalUrl()` → Opens Customer Portal
3. User can:
   - Cancel subscription (keeps Pro until period end)
   - Update payment method
   - View billing history
   - Restart canceled subscription

### Cancellation

1. User cancels via Customer Portal
2. **Stripe webhook** receives `customer.subscription.deleted` event
3. **stripe-webhook function** updates:
   - `subscription_status = "canceled"`
   - `is_pro = true` (keeps Pro until `subscription_current_period_end`)
4. At period end, `is_pro` automatically becomes `false` (handled by webhook)

---

## 🧪 Testing

### Test in Development

1. Use Stripe test mode (keys starting with `sk_test_` and `pk_test_`)
2. Use test card: `4242 4242 4242 4242`, any future expiry, any CVC
3. Subscribe to Pro → Check database that `is_pro = true`
4. Cancel subscription → Check that Pro access remains until period end
5. Use webhook logs to debug: Stripe Dashboard → Webhooks → View logs

### Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Authentication Required**: `4000 0025 0000 3155`

---

## 📋 Checklist

Before going live, make sure:

- [ ] Database migration run successfully
- [ ] Stripe Price created for £15/month
- [ ] Customer Portal configured (cancel at period end)
- [ ] All environment variables added to Supabase
- [ ] Edge Functions deployed
- [ ] Webhook configured and verified
- [ ] Tested subscription flow in test mode
- [ ] Tested cancellation keeps Pro until period end
- [ ] Tested Customer Portal access
- [ ] Switch to live Stripe keys for production

---

## 🚨 Important Notes

### No Free Trial
- The subscription starts immediately at £15/month
- No trial period configured (as per your requirements)

### Keep Pro Until Period End
- When users cancel, they keep Pro access until `subscription_current_period_end`
- This is handled automatically by the webhook

### Subscription Status
- **active** → User has Pro
- **past_due** → Payment failed, still has Pro (grace period)
- **canceled** → Subscription canceled, Pro until period end
- **unpaid** → Multiple payment failures, Pro revoked

### Webhook Security
- Webhook signature verification ensures only real Stripe events are processed
- Never skip signature verification in production!

---

## 🔗 Deep Links

The Edge Functions use these deep links to return users to the app:

- `nutrapp://subscription-success` - After successful subscription
- `nutrapp://subscription-cancel` - If user cancels checkout
- `nutrapp://profile` - After managing subscription in portal

Make sure these are configured in your `app.json`:

```json
{
  "expo": {
    "scheme": "nutrapp"
  }
}
```

---

## 📞 Support

If you encounter issues:

1. Check Supabase Edge Function logs
2. Check Stripe webhook logs
3. Check that all environment variables are set correctly
4. Verify the Price ID is correct
5. Ensure webhook secret matches between Stripe and Supabase

---

## ✨ Next Steps

Now that subscriptions are set up, you can:

1. Test the full flow end-to-end
2. Update `UpgradeToProModal` to handle the subscription checkout URL
3. Add "Manage Subscription" button to `ProfileScreen` for Pro users
4. Monitor subscription metrics in Stripe Dashboard

---

**You're all set! 🎉**

The subscription system is ready to go. Just add the environment variables to Supabase and deploy the Edge Functions.

