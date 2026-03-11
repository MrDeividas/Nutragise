-- Create Weekly Recurring Challenges for Core Habits
-- This creates parent recurring challenges that will generate weekly 7-day instances

-- Helper function to get admin user or first user for created_by
DO $$
DECLARE
  admin_user_id UUID;
  challenge_ids UUID[];
  challenge_id UUID;
BEGIN
  -- Get admin user or first user
  SELECT id INTO admin_user_id
  FROM profiles
  WHERE EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = profiles.id AND is_active = true
  )
  LIMIT 1;
  
  -- If no admin, get first user
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id
    FROM profiles
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  -- 1. Gym Challenge - 5 submission days
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
    'Gym Challenge',
    'Complete your gym workout 5 times this week. Track your progress and compete with others!',
    'fitness',
    1,
    10.00,
    'automatic',
    date_trunc('week', NOW()) + interval '1 minute',
    date_trunc('week', NOW()) + interval '6 days 23 hours 59 minutes',
    'active',
    true,
    'weekly',
    false,
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
    admin_user_id
  ) RETURNING id INTO challenge_id;
  
  INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
  VALUES (challenge_id, 'Complete gym workout', 'daily', 5, 1);
  
  INSERT INTO challenge_pots (challenge_id, total_amount, platform_fee_percentage, platform_fee_amount, winners_pot, status)
  VALUES (challenge_id, 0.00, 30.00, 0.00, 0.00, 'collecting');

  -- 2. Exercise Challenge (tracks run habit) - 3 submission days
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
    'Exercise Challenge',
    'Complete your run or exercise 3 times this week. Stay active and build consistency!',
    'fitness',
    1,
    10.00,
    'automatic',
    date_trunc('week', NOW()) + interval '1 minute',
    date_trunc('week', NOW()) + interval '6 days 23 hours 59 minutes',
    'active',
    true,
    'weekly',
    false,
    'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800',
    admin_user_id
  ) RETURNING id INTO challenge_id;
  
  INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
  VALUES (challenge_id, 'Complete run or exercise', 'daily', 3, 1);
  
  INSERT INTO challenge_pots (challenge_id, total_amount, platform_fee_percentage, platform_fee_amount, winners_pot, status)
  VALUES (challenge_id, 0.00, 30.00, 0.00, 0.00, 'collecting');

  -- 3. Goal Update Challenge - 5 submissions
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
    'Goal Update Challenge',
    'Update your goals 5 times this week. Track your progress and stay accountable!',
    'wellness',
    1,
    10.00,
    'automatic',
    date_trunc('week', NOW()) + interval '1 minute',
    date_trunc('week', NOW()) + interval '6 days 23 hours 59 minutes',
    'active',
    true,
    'weekly',
    false,
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
    admin_user_id
  ) RETURNING id INTO challenge_id;
  
  INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
  VALUES (challenge_id, 'Update goal', 'daily', 5, 1);
  
  INSERT INTO challenge_pots (challenge_id, total_amount, platform_fee_percentage, platform_fee_amount, winners_pot, status)
  VALUES (challenge_id, 0.00, 30.00, 0.00, 0.00, 'collecting');

  -- 4. Microlearn Challenge - 7 submissions
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
    'Microlearn Challenge',
    'Complete microlearning 7 times this week. Learn something new every day!',
    'growth',
    1,
    10.00,
    'automatic',
    date_trunc('week', NOW()) + interval '1 minute',
    date_trunc('week', NOW()) + interval '6 days 23 hours 59 minutes',
    'active',
    true,
    'weekly',
    false,
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800',
    admin_user_id
  ) RETURNING id INTO challenge_id;
  
  INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
  VALUES (challenge_id, 'Complete microlearning', 'daily', 7, 1);
  
  INSERT INTO challenge_pots (challenge_id, total_amount, platform_fee_percentage, platform_fee_amount, winners_pot, status)
  VALUES (challenge_id, 0.00, 30.00, 0.00, 0.00, 'collecting');

  -- 5. Focus Challenge - 7 submissions
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
    'Focus Challenge',
    'Complete your focus session 7 times this week. Build deep work habits!',
    'growth',
    1,
    10.00,
    'automatic',
    date_trunc('week', NOW()) + interval '1 minute',
    date_trunc('week', NOW()) + interval '6 days 23 hours 59 minutes',
    'active',
    true,
    'weekly',
    false,
    'https://images.unsplash.com/photo-1509228468512-6c0c2e4825f4?w=800',
    admin_user_id
  ) RETURNING id INTO challenge_id;
  
  INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
  VALUES (challenge_id, 'Complete focus session', 'daily', 7, 1);
  
  INSERT INTO challenge_pots (challenge_id, total_amount, platform_fee_percentage, platform_fee_amount, winners_pot, status)
  VALUES (challenge_id, 0.00, 30.00, 0.00, 0.00, 'collecting');

  -- 6. Reflection Challenge - 7 submission days
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
    'Reflection Challenge',
    'Complete your daily reflection 7 times this week. Build self-awareness and growth!',
    'wellness',
    1,
    10.00,
    'automatic',
    date_trunc('week', NOW()) + interval '1 minute',
    date_trunc('week', NOW()) + interval '6 days 23 hours 59 minutes',
    'active',
    true,
    'weekly',
    false,
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
    admin_user_id
  ) RETURNING id INTO challenge_id;
  
  INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
  VALUES (challenge_id, 'Complete reflection', 'daily', 7, 1);
  
  INSERT INTO challenge_pots (challenge_id, total_amount, platform_fee_percentage, platform_fee_amount, winners_pot, status)
  VALUES (challenge_id, 0.00, 30.00, 0.00, 0.00, 'collecting');

  -- 7. Water Challenge - 7 submissions
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
    'Water Challenge',
    'Track your water intake 7 times this week. Stay hydrated and healthy!',
    'wellness',
    1,
    10.00,
    'automatic',
    date_trunc('week', NOW()) + interval '1 minute',
    date_trunc('week', NOW()) + interval '6 days 23 hours 59 minutes',
    'active',
    true,
    'weekly',
    false,
    'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800',
    admin_user_id
  ) RETURNING id INTO challenge_id;
  
  INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
  VALUES (challenge_id, 'Track water intake', 'daily', 7, 1);
  
  INSERT INTO challenge_pots (challenge_id, total_amount, platform_fee_percentage, platform_fee_amount, winners_pot, status)
  VALUES (challenge_id, 0.00, 30.00, 0.00, 0.00, 'collecting');

  -- 8. Cold Shower Challenge - 7 submissions
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
    'Cold Shower Challenge',
    'Complete cold shower 7 times this week. Build mental resilience!',
    'wellness',
    1,
    10.00,
    'automatic',
    date_trunc('week', NOW()) + interval '1 minute',
    date_trunc('week', NOW()) + interval '6 days 23 hours 59 minutes',
    'active',
    true,
    'weekly',
    false,
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
    admin_user_id
  ) RETURNING id INTO challenge_id;
  
  INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
  VALUES (challenge_id, 'Complete cold shower', 'daily', 7, 1);
  
  INSERT INTO challenge_pots (challenge_id, total_amount, platform_fee_percentage, platform_fee_amount, winners_pot, status)
  VALUES (challenge_id, 0.00, 30.00, 0.00, 0.00, 'collecting');

  -- 9. Screen Time Challenge - 7 submissions
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
    'Screen Time Challenge',
    'Stay within your screen time limit 7 times this week. Build digital wellness!',
    'wellness',
    1,
    10.00,
    'automatic',
    date_trunc('week', NOW()) + interval '1 minute',
    date_trunc('week', NOW()) + interval '6 days 23 hours 59 minutes',
    'active',
    true,
    'weekly',
    false,
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
    admin_user_id
  ) RETURNING id INTO challenge_id;
  
  INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
  VALUES (challenge_id, 'Stay within screen time limit', 'daily', 7, 1);
  
  INSERT INTO challenge_pots (challenge_id, total_amount, platform_fee_percentage, platform_fee_amount, winners_pot, status)
  VALUES (challenge_id, 0.00, 30.00, 0.00, 0.00, 'collecting');

  -- 10. Sleep Challenge - 7 submissions
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
    'Sleep Challenge',
    'Track your sleep 7 times this week. Prioritize rest and recovery!',
    'wellness',
    1,
    10.00,
    'automatic',
    date_trunc('week', NOW()) + interval '1 minute',
    date_trunc('week', NOW()) + interval '6 days 23 hours 59 minutes',
    'active',
    true,
    'weekly',
    false,
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
    admin_user_id
  ) RETURNING id INTO challenge_id;
  
  INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
  VALUES (challenge_id, 'Track sleep', 'daily', 7, 1);
  
  INSERT INTO challenge_pots (challenge_id, total_amount, platform_fee_percentage, platform_fee_amount, winners_pot, status)
  VALUES (challenge_id, 0.00, 30.00, 0.00, 0.00, 'collecting');

  -- 11. Meditation Challenge - 7 submissions
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
    'Meditation Challenge',
    'Complete meditation 7 times this week. Build mindfulness and calm!',
    'wellness',
    1,
    10.00,
    'automatic',
    date_trunc('week', NOW()) + interval '1 minute',
    date_trunc('week', NOW()) + interval '6 days 23 hours 59 minutes',
    'active',
    true,
    'weekly',
    false,
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
    admin_user_id
  ) RETURNING id INTO challenge_id;
  
  INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
  VALUES (challenge_id, 'Complete meditation', 'daily', 7, 1);
  
  INSERT INTO challenge_pots (challenge_id, total_amount, platform_fee_percentage, platform_fee_amount, winners_pot, status)
  VALUES (challenge_id, 0.00, 30.00, 0.00, 0.00, 'collecting');

  RAISE NOTICE '✅ Created 11 core habit challenges successfully';
END $$;
