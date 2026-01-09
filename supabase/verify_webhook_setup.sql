-- Verification queries to check webhook-related data
-- Run these in Supabase SQL Editor

-- 1. Check if user has Stripe customer ID (required for webhook to work)
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

-- 2. Check all users with Stripe subscriptions but is_pro = false (potential webhook failures)
SELECT 
  id,
  username,
  is_pro,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status,
  subscription_current_period_end,
  CASE 
    WHEN stripe_subscription_id IS NOT NULL AND is_pro = false THEN '⚠️ Subscription exists but is_pro is false'
    WHEN stripe_customer_id IS NOT NULL AND stripe_subscription_id IS NULL THEN '⚠️ Customer ID exists but no subscription'
    ELSE '✅ Status looks correct'
  END as status_check
FROM profiles
WHERE stripe_customer_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- 3. Check recent subscription-related activity
SELECT 
  p.username,
  p.is_pro,
  p.stripe_customer_id,
  p.stripe_subscription_id,
  p.subscription_status,
  p.subscription_current_period_end,
  p.updated_at as profile_updated_at
FROM profiles p
WHERE p.stripe_customer_id IS NOT NULL
ORDER BY p.updated_at DESC
LIMIT 10;

