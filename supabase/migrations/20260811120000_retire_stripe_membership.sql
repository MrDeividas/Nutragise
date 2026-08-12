-- Retire Stripe Pro membership. Pro is RevenueCat / Apple IAP only.
-- Stripe remains for wallet deposits and challenge payments.
-- stripe_customer_id is left intact (harmless; deposits use PaymentIntents without it).

COMMENT ON COLUMN public.profiles.stripe_subscription_id IS
  'DEPRECATED — Stripe Pro subscriptions removed. Pro is managed by RevenueCat (is_pro).';

COMMENT ON COLUMN public.profiles.is_premium IS
  'DEPRECATED — legacy Stripe/onboarding flag. Use is_pro (RevenueCat webhook).';

UPDATE public.profiles
SET
  stripe_subscription_id = NULL,
  subscription_status = CASE
    WHEN subscription_source IN ('apple', 'google', 'revenuecat') THEN subscription_status
    WHEN stripe_subscription_id IS NOT NULL THEN NULL
    ELSE subscription_status
  END,
  subscription_current_period_end = CASE
    WHEN subscription_source IN ('apple', 'google', 'revenuecat') THEN subscription_current_period_end
    WHEN stripe_subscription_id IS NOT NULL THEN NULL
    ELSE subscription_current_period_end
  END
WHERE stripe_subscription_id IS NOT NULL;
