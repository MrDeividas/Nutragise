-- Adds RevenueCat subscription tracking to profiles.
-- subscription_source identifies which store / processor owns the active Pro entitlement
--   'apple'  = Apple In-App Purchase (via RevenueCat)
--   'google' = Google Play Billing  (via RevenueCat)
--   'stripe' = legacy / web Stripe subscription (historic data only after the clean cut)
--   null     = no active subscription / unknown
-- revenuecat_app_user_id stores the RevenueCat App User ID we link to via Purchases.logIn(userId).

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS subscription_source text,
    ADD COLUMN IF NOT EXISTS revenuecat_app_user_id text;

CREATE INDEX IF NOT EXISTS profiles_revenuecat_app_user_id_idx
    ON public.profiles (revenuecat_app_user_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_subscription_source_check'
    ) THEN
        ALTER TABLE public.profiles
            ADD CONSTRAINT profiles_subscription_source_check
            CHECK (subscription_source IS NULL OR subscription_source IN ('apple', 'google', 'stripe'));
    END IF;
END $$;
