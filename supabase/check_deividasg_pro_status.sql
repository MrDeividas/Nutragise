-- Diagnostic query to check deividasg account Pro status
-- Run this in Supabase SQL Editor to see what happened with the subscription

-- 1. Check profile and subscription status
SELECT 
  id,
  username,
  display_name,
  is_pro,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status,
  subscription_current_period_end,
  created_at
FROM profiles
WHERE username = 'deividasg21' OR username LIKE '%deividasg%'
ORDER BY created_at DESC;

-- 2. Check if there are any notifications related to this user
SELECT 
  n.id,
  n.notification_type,
  n.from_user_id,
  n.created_at,
  p.username as from_username
FROM notifications n
LEFT JOIN profiles p ON p.id = n.from_user_id
WHERE n.user_id IN (
  SELECT id FROM profiles WHERE username = 'deividasg21' OR username LIKE '%deividasg%'
)
ORDER BY n.created_at DESC
LIMIT 20;

-- 3. Check Stripe webhook logs (if you have access to Supabase logs)
-- This would show if webhooks were received and processed

-- 4. Manual fix: If subscription exists in Stripe but is_pro is false, you can:
-- UPDATE profiles 
-- SET is_pro = true,
--     subscription_status = 'active'
-- WHERE username = 'deividasg21' 
--   AND stripe_subscription_id IS NOT NULL;

