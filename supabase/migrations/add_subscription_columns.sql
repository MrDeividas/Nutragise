-- Add subscription tracking columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT,
ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON profiles(stripe_subscription_id);

-- Add comment
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe Customer ID for subscription management';
COMMENT ON COLUMN profiles.stripe_subscription_id IS 'Active Stripe Subscription ID';
COMMENT ON COLUMN profiles.subscription_status IS 'Subscription status: active, canceled, past_due, etc.';
COMMENT ON COLUMN profiles.subscription_current_period_end IS 'When current subscription period ends (keep Pro until this date)';

