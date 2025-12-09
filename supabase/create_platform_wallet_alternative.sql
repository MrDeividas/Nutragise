-- Alternative: Create Platform Wallet (if direct auth.users insert fails)
-- This approach uses a database function with elevated permissions

-- Step 1: Create a function to create platform user and wallet
CREATE OR REPLACE FUNCTION create_platform_wallet()
RETURNS TABLE(wallet_id UUID, user_id UUID, balance DECIMAL) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  platform_user_id UUID := '00000000-0000-0000-0000-000000000000';
  platform_wallet_id UUID;
  user_exists BOOLEAN;
BEGIN
  -- Check if platform user already exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = platform_user_id) INTO user_exists;

  -- If user doesn't exist, create it
  IF NOT user_exists THEN
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
      crypt('platform_internal_' || gen_random_uuid()::text, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "internal", "providers": ["internal"]}'::jsonb,
      '{"platform_account": true}'::jsonb,
      false,
      'authenticated'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Get or create wallet
  SELECT id INTO platform_wallet_id
  FROM user_wallets
  WHERE user_id = platform_user_id;

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
  END IF;

  -- Return result
  RETURN QUERY
  SELECT 
    platform_wallet_id,
    platform_user_id,
    0.00::DECIMAL;
END;
$$;

-- Step 2: Run the function
SELECT * FROM create_platform_wallet();

-- Step 3: Create profile entry
INSERT INTO profiles (id, username, display_name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'platform',
  'Platform Account',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Verify
SELECT 
  'Platform Wallet' as type,
  id as wallet_id,
  user_id,
  balance,
  created_at
FROM user_wallets
WHERE user_id = '00000000-0000-0000-0000-000000000000';

