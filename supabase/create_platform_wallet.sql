-- Step 1: Create Platform Wallet for Fee Collection
-- This creates a special wallet to collect all platform fees

-- First, create a platform user in auth.users (required for foreign key)
DO $$
DECLARE
  platform_user_id UUID := '00000000-0000-0000-0000-000000000000';
  platform_wallet_id UUID;
  user_exists BOOLEAN;
BEGIN
  -- Check if platform user already exists in auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = platform_user_id) INTO user_exists;

  -- If user doesn't exist, create it
  IF NOT user_exists THEN
    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    )
    VALUES (
      platform_user_id,
      '00000000-0000-0000-0000-000000000000',
      'platform@nutrapp.internal',
      crypt('platform_internal_account_' || gen_random_uuid()::text, gen_salt('bf')), -- Random password, won't be used
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "internal", "providers": ["internal"]}'::jsonb,
      '{"platform_account": true}'::jsonb,
      false,
      'authenticated'
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE '✅ Platform user created in auth.users';
  ELSE
    RAISE NOTICE 'ℹ️ Platform user already exists in auth.users';
  END IF;

  -- Check if platform wallet already exists
  SELECT id INTO platform_wallet_id
  FROM user_wallets
  WHERE user_id = platform_user_id;

  -- If wallet doesn't exist, create it
  IF platform_wallet_id IS NULL THEN
    INSERT INTO user_wallets (id, user_id, balance, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      platform_user_id,
      0.00,
      NOW(),
      NOW()
    )
    RETURNING id INTO platform_wallet_id;

    RAISE NOTICE '✅ Platform wallet created with ID: %', platform_wallet_id;
  ELSE
    RAISE NOTICE 'ℹ️ Platform wallet already exists with ID: %', platform_wallet_id;
  END IF;
END $$;

-- Verify platform wallet was created
SELECT 
  id,
  user_id,
  balance,
  created_at
FROM user_wallets
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- Optional: Create a profile entry for the platform (for admin dashboard)
-- This is optional but can be useful for viewing platform earnings
INSERT INTO profiles (id, username, display_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'platform',
  'Platform Account',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- View current platform wallet balance
SELECT 
  'Platform Wallet Balance' as description,
  balance as current_balance,
  (SELECT COUNT(*) FROM wallet_transactions WHERE wallet_id = user_wallets.id AND type = 'fee') as fee_transactions_count,
  (SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions WHERE wallet_id = user_wallets.id AND type = 'fee') as total_fees_collected
FROM user_wallets
WHERE user_id = '00000000-0000-0000-0000-000000000000';

