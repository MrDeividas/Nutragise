-- Quick fix for deividasg account
-- This will sync the subscription status from Stripe

-- IMPORTANT: First, get these values from Stripe Dashboard:
-- 1. Go to Stripe Dashboard → Customers
-- 2. Search for deividasg's email or find the customer
-- 3. Copy the Customer ID (starts with cus_)
-- 4. Go to Subscriptions tab, copy the Subscription ID (starts with sub_)
-- 5. Check the "Current period end" date

-- Then update the query below with the actual values:

-- Step 1: Update stripe_customer_id (IMPORTANT - webhook needs this!)
UPDATE profiles
SET stripe_customer_id = 'cus_xxxxx' -- Replace with actual Customer ID from Stripe Dashboard
WHERE username = 'deividasg21' OR username LIKE '%deividasg%';

-- Step 2: Update subscription status
UPDATE profiles
SET 
  is_pro = true,
  subscription_status = 'active',
  stripe_subscription_id = 'sub_xxxxx', -- Replace with actual subscription ID from Stripe
  subscription_current_period_end = '2025-02-15T00:00:00Z'::timestamp -- Replace with actual end date from Stripe
WHERE username = 'deividasg21' OR username LIKE '%deividasg%';

-- Option 2: If you know the Stripe Customer ID but not the username
-- UPDATE profiles
-- SET 
--   is_pro = true,
--   subscription_status = 'active',
--   stripe_subscription_id = 'sub_xxxxx',
--   subscription_current_period_end = '2025-02-15T00:00:00Z'::timestamp
-- WHERE stripe_customer_id = 'cus_xxxxx'; -- Replace with actual customer ID

-- Verify the update
SELECT 
  id,
  username,
  email,
  is_pro,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status,
  subscription_current_period_end,
  updated_at
FROM profiles
WHERE username = 'deividasg21' OR username LIKE '%deividasg%';

