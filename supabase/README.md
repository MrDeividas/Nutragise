# Supabase — Application (production)

**Project:** Application
**Ref:** `gtnjrauujrzkesaulius`
**URL:** `https://gtnjrauujrzkesaulius.supabase.co`
**Dashboard:** https://supabase.com/dashboard/project/gtnjrauujrzkesaulius

CLI is linked to this project (see `.supabase-project-ref`).

## App `.env`

```env
SUPABASE_URL=https://gtnjrauujrzkesaulius.supabase.co
SUPABASE_ANON_KEY=<anon key from Dashboard → Settings → API>
# Wallet deposits + challenge payments ONLY (not Pro). Use pk_live_… for production.
STRIPE_PUBLISHABLE_KEY=pk_live_...
REVENUECAT_IOS_API_KEY=appl_...
REVENUECAT_ANDROID_API_KEY=goog_...
```

Server-only Edge Function secrets (Dashboard → Edge Functions → Secrets):

```env
DEEPSEEK_API_KEY=...
SIGHTENGINE_API_USER=...
SIGHTENGINE_API_SECRET=...
STRIPE_SECRET_KEY=sk_live_...   # same mode as publishable key (live ↔ live)
REVENUECAT_WEBHOOK_AUTH=...     # shared secret for RevenueCat → revenuecat-webhook
```

Deploy AI + moderation proxies:

```bash
supabase functions deploy deepseek-chat
supabase functions deploy moderate-media
```

Restart Metro after app `.env` changes: `npm start -- --reset-cache`

## Money split (important)

| What | Provider |
|------|----------|
| **Pro membership** (trial + monthly) | **RevenueCat** + Apple IAP (entitlement `pro`) |
| **Wallet deposits / challenge card payments** | **Stripe** PaymentIntents only |

Do **not** recreate Stripe Checkout subscriptions, Customer Portal, or a Stripe webhook that sets `profiles.is_pro`. Those edge functions were deleted:

- `create-subscription`
- `create-subscription-payment-sheet`
- `get-customer-portal`
- `sync-subscription-status`
- `stripe-webhook` (old Pro webhook)

Pro source of truth: `revenuecat-webhook` → `profiles.is_pro`.

## Go live checklist

### 1. Stripe → Live mode (deposits)

1. Stripe Dashboard → toggle **Test mode OFF**.
2. Developers → API keys → copy **Publishable** (`pk_live_…`) and **Secret** (`sk_live_…`).
3. App `.env`: set `STRIPE_PUBLISHABLE_KEY=pk_live_…`
4. Supabase → Edge Functions → Secrets: set `STRIPE_SECRET_KEY=sk_live_…` (replace any `sk_test_…`).
5. Stripe → Developers → Webhooks: **delete** any endpoint that pointed at `…/functions/v1/stripe-webhook` (that function is gone). Deposits are confirmed in-app; no Stripe webhook is required for Pro.
6. Optional cleanup: remove unused Stripe Product/Price for “Pro membership” and secrets like `STRIPE_PRO_PRICE_ID` / `STRIPE_WEBHOOK_SECRET` if still present.
7. EAS / store builds: set the same `STRIPE_PUBLISHABLE_KEY` live value as a build secret (`.env` is not shipped in release builds).

### 2. RevenueCat + App Store (Pro)

1. App Store Connect → subscription product (e.g. `nutragise_pro_monthly`) + **1-week free trial** introductory offer.
2. RevenueCat → products / offering / entitlement **`pro`** linked to that App Store product.
3. RevenueCat → Project settings → API keys → iOS public SDK key in `.env` + EAS as `REVENUECAT_IOS_API_KEY`.
4. RevenueCat → Integrations → Webhooks:
   - URL: `https://gtnjrauujrzkesaulius.supabase.co/functions/v1/revenuecat-webhook`
   - Authorization: `Bearer <same value as REVENUECAT_WEBHOOK_AUTH>`
5. Test with a **Sandbox** Apple ID on a **TestFlight / device build** (not Expo Go).

### 3. Ship

```bash
# After secrets are live:
eas build --platform ios --profile production   # or your TestFlight profile
```

Confirm deposit: Wallet → Add funds → live card (small amount).  
Confirm Pro: paywall → Sandbox purchase → `profiles.is_pro` becomes true after webhook.

## Migrations

Common scripts (also applied remotely when using MCP / SQL Editor):

- `20260609120000_add_subscription_source.sql` — RevenueCat columns on `profiles`
- `20260811120000_retire_stripe_membership.sql` — clears legacy `stripe_subscription_id`; Pro = RevenueCat only

## Edge Functions

```bash
supabase link --project-ref gtnjrauujrzkesaulius
supabase functions deploy
```

**Secrets** (Dashboard → Edge Functions → Secrets):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` — **live** `sk_live_…` for production deposits/challenges
- `REVENUECAT_WEBHOOK_AUTH` — `Authorization: Bearer …` on RevenueCat webhook calls

RevenueCat webhook URL: `https://gtnjrauujrzkesaulius.supabase.co/functions/v1/revenuecat-webhook`

## TestFlight / Play internal testing

Use the same `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `STRIPE_PUBLISHABLE_KEY` (**live** for real money), `REVENUECAT_IOS_API_KEY`, and `REVENUECAT_ANDROID_API_KEY` as EAS build secrets (`.env` is not bundled into store builds).
