-- Manual sync script to fix subscription status
-- Run this AFTER getting the Stripe customer ID and subscription ID from Stripe Dashboard

-- Step 1: Find the user's Stripe customer ID from Stripe Dashboard
-- Go to Stripe Dashboard → Customers → Find your account → Copy Customer ID (starts with cus_)

-- Step 2: Update the profile with subscription info
-- Replace 'cus_xxxxx' with your actual Stripe customer ID
-- Replace 'sub_xxxxx' with your actual subscription ID from Stripe Dashboard

UPDATE profiles
SET 
  is_pro = true,
  subscription_status = 'active',
  stripe_subscription_id = 'sub_xxxxx', -- Replace with actual subscription ID
  subscription_current_period_end = (NOW() + INTERVAL '1 month')::timestamp -- Set to actual end date from Stripe
WHERE stripe_customer_id = 'cus_xxxxx'; -- Replace with actual customer ID

-- Step 3: Verify the update
SELECT 
  id,
  username,
  is_pro,
  stripe_customer_id,
  stripe_subscription_id,
  subscription_status,
  subscription_current_period_end
FROM profiles
WHERE stripe_customer_id = 'cus_xxxxx'; -- Replace with actual customer ID

