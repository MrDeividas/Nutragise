-- Fix Daily Smile Challenge - Create parent challenge if missing or activate existing one
-- ⚠️ Run the check_daily_smile_challenge.sql first to see what exists
-- ⚠️ Make sure to backup your database before running this!

-- Step 1: Check if a parent challenge exists (but might not be active)
-- If one exists, we'll activate it. If not, we'll create a new one.

-- Option A: If a parent challenge exists but is not active, activate it
UPDATE challenges
SET status = 'active'
WHERE title LIKE '%Daily Smile Challenge%'
  AND is_recurring = true
  AND recurring_schedule = 'daily'
  AND status != 'active'
  AND id IN (
    -- Get the most recent parent challenge (oldest created_at for parent)
    SELECT id
    FROM challenges
    WHERE title LIKE '%Daily Smile Challenge%'
      AND is_recurring = true
      AND recurring_schedule = 'daily'
    ORDER BY created_at ASC
    LIMIT 1
  );

-- Option B: If no parent challenge exists, create one
-- This will only run if the UPDATE above didn't find anything
-- Note: You may need to adjust the created_by user ID and other fields

DO $$
DECLARE
  parent_exists BOOLEAN;
  admin_user_id UUID;
BEGIN
  -- Check if parent challenge exists
  SELECT EXISTS(
    SELECT 1 
    FROM challenges 
    WHERE title LIKE '%Daily Smile Challenge%'
      AND is_recurring = true
      AND recurring_schedule = 'daily'
      AND status = 'active'
  ) INTO parent_exists;

  -- If no active parent exists, create one
  IF NOT parent_exists THEN
    -- Get an admin user or the first user (adjust as needed)
    SELECT id INTO admin_user_id
    FROM profiles
    WHERE is_admin = true
    LIMIT 1;
    
    -- If no admin, get first user
    IF admin_user_id IS NULL THEN
      SELECT id INTO admin_user_id
      FROM profiles
      ORDER BY created_at ASC
      LIMIT 1;
    END IF;

    -- Create parent Daily Smile Challenge
    INSERT INTO challenges (
      title,
      description,
      category,
      duration_weeks,
      entry_fee,
      verification_type,
      start_date,
      end_date,
      status,
      is_recurring,
      recurring_schedule,
      is_pro_only,
      image_url,
      created_by
    ) VALUES (
      'Daily Smile Challenge',
      'Share a smile photo every day! This challenge runs daily and helps spread positivity.',
      'wellness',
      0, -- Daily challenges don't have weeks
      0.00, -- Free challenge (adjust if you want a paid version)
      'photo',
      CURRENT_DATE, -- Start today
      CURRENT_DATE + INTERVAL '1 day', -- End tomorrow
      'active', -- Must be active for handleRecurringChallenges to work
      true,
      'daily',
      false, -- Not pro-only (adjust if needed)
      'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800', -- Smile/happiness image
      admin_user_id
    );

    -- Get the newly created challenge ID and add requirements
    INSERT INTO challenge_requirements (
      challenge_id,
      requirement_text,
      frequency,
      target_count,
      requirement_order
    )
    SELECT 
      id,
      'Share a smile photo',
      'daily',
      1,
      1
    FROM challenges
    WHERE title = 'Daily Smile Challenge'
      AND is_recurring = true
      AND recurring_schedule = 'daily'
      AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;

    -- Create the challenge pot
    INSERT INTO challenge_pots (
      challenge_id,
      total_amount,
      platform_fee_percentage,
      platform_fee_amount,
      winners_pot,
      status
    )
    SELECT 
      id,
      0.00,
      30.00,
      0.00,
      0.00,
      'collecting'
    FROM challenges
    WHERE title = 'Daily Smile Challenge'
      AND is_recurring = true
      AND recurring_schedule = 'daily'
      AND status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;

    RAISE NOTICE '✅ Created new Daily Smile Challenge parent';
  ELSE
    RAISE NOTICE '✅ Parent challenge already exists and is active';
  END IF;
END $$;

-- Step 2: Verify the fix
SELECT 
  id,
  title,
  status,
  is_recurring,
  recurring_schedule,
  entry_fee,
  created_at,
  CASE 
    WHEN status = 'active' AND is_recurring = true AND recurring_schedule = 'daily' 
    THEN '✅ PARENT CHALLENGE - Will generate daily instances'
    ELSE '⚠️ Check configuration'
  END as verification
FROM challenges
WHERE title LIKE '%Daily Smile Challenge%'
  AND is_recurring = true
  AND recurring_schedule = 'daily'
ORDER BY created_at ASC
LIMIT 1;
