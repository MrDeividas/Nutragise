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
STRIPE_PUBLISHABLE_KEY=pk_live_or_test_...
REVENUECAT_IOS_API_KEY=appl_...
REVENUECAT_ANDROID_API_KEY=goog_...
DEEPSEEK_API_KEY=...
```

Restart Metro after changes: `npm start -- --reset-cache`

## Migrations

Most files in `migrations/` are **not** applied by `supabase db push` until renamed to `YYYYMMDDHHMMSS_name.sql`. Until then, run needed SQL manually in **SQL Editor** on the Application project.

Common scripts to run by hand:

- `add_delete_user_rpc.sql` — account deletion
- `20260518204312_create_reminders_table.sql` — reminders table
- `20260609120000_add_subscription_source.sql` — RevenueCat columns on `profiles`
- `swap_pro_15k_steps_and_no_junk_food.sql` — requires `public.challenges` to exist

## Edge Functions

```bash
supabase link --project-ref gtnjrauujrzkesaulius
supabase functions deploy
```

**Secrets** (Dashboard → Edge Functions → Secrets):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` — wallet deposits + challenge payments
- `REVENUECAT_WEBHOOK_AUTH` — shared secret expected as `Authorization: Bearer ...` on RevenueCat webhook calls

Pro subscriptions now flow through **RevenueCat** (Apple IAP / Google Play Billing). The Stripe subscription edge functions and webhook have been removed.

RevenueCat webhook URL: `https://gtnjrauujrzkesaulius.supabase.co/functions/v1/revenuecat-webhook`

## TestFlight / Play internal testing

Use the same `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `STRIPE_PUBLISHABLE_KEY`, `REVENUECAT_IOS_API_KEY`, and `REVENUECAT_ANDROID_API_KEY` as EAS build secrets (`.env` is not bundled into store builds).
