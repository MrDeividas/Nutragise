-- Seed 15 curated weekly challenges (7 available to all users + 8 pro-only), each with £10 entry fee.
-- Idempotent: uses ON CONFLICT DO NOTHING on title so re-running is safe.
-- challenge_requirements are also guarded with ON CONFLICT DO NOTHING.
-- Assumes a UNIQUE constraint exists on challenges(title); if not, the
-- INSERT will still work — it will just skip the ON CONFLICT clause.

DO $$
DECLARE
  v_admin_id  uuid;
  v_start     timestamptz;
  v_end       timestamptz;
  v_next_rec  timestamptz;
  v_id        uuid;
BEGIN
  -- Resolve admin/creator: oldest user in auth.users
  SELECT id INTO v_admin_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  -- Next full Mon–Sun week (Mon 00:00 UTC)
  v_start    := date_trunc('week', now() + interval '7 days') + interval '1 day';
  v_end      := v_start + interval '7 days';
  v_next_rec := v_end  + interval '1 day';

  -- ────────────────────────────────────────────────────────────────
  -- FREE CHALLENGES
  -- ────────────────────────────────────────────────────────────────

  -- 1. Make Your Bed Challenge (7/7)
  INSERT INTO challenges (
    title, description, category, duration_weeks, entry_fee,
    verification_type, start_date, end_date, created_by, status,
    is_recurring, recurring_schedule, next_recurrence,
    is_pro_only, visibility
  ) VALUES (
    'Make Your Bed',
    'Start every morning with a win. Make your bed each day and build the discipline that sets the tone for everything that follows.',
    'wellness', 1, 10, 'photo', v_start, v_end, v_admin_id, 'upcoming',
    true, 'weekly', v_next_rec, false, 'public'
  )
  ON CONFLICT (title) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
    VALUES (v_id, 'Post a photo of your made bed each day — 7 days required to pass.', 'weekly', 7, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 2. Spread Positivity (7/7)
  v_id := NULL;
  INSERT INTO challenges (
    title, description, category, duration_weeks, entry_fee,
    verification_type, start_date, end_date, created_by, status,
    is_recurring, recurring_schedule, next_recurrence,
    is_pro_only, visibility
  ) VALUES (
    'Spread Positivity',
    'Each day, spread something genuinely positive in the real world or online. Examples: post something kind or uplifting on social media; share an encouraging story, reel, or comment; send a supportive message to a friend or family member; compliment someone; check in on someone who might need it; or do another clear act of goodwill toward another person. Your requirement is to take a photo that shows what you did—for instance your post or story on screen (you can blur or crop private details), your kind DM or text conversation, or a photo of the moment if everyone pictured is okay with it. Upload that picture each day as proof. Seven days of proof are required to pass.',
    'wellness', 1, 10, 'photo', v_start, v_end, v_admin_id, 'upcoming',
    true, 'weekly', v_next_rec, false, 'public'
  )
  ON CONFLICT (title) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
    VALUES (v_id, 'Each day, take a photo that shows you spreading positivity—such as a kind social post or story, a supportive message to a friend or someone else, or another clear positive act—and upload it. 7 days required to pass.', 'weekly', 7, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 3. Journal 1 Thought (7/7)
  v_id := NULL;
  INSERT INTO challenges (
    title, description, category, duration_weeks, entry_fee,
    verification_type, start_date, end_date, created_by, status,
    is_recurring, recurring_schedule, next_recurrence,
    is_pro_only, visibility
  ) VALUES (
    'Journal 1 Thought',
    'Write one honest thought each day. No word count, no rules — just a moment of reflection that builds self-awareness over time.',
    'mindfulness', 1, 10, 'photo', v_start, v_end, v_admin_id, 'upcoming',
    true, 'weekly', v_next_rec, false, 'public'
  )
  ON CONFLICT (title) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
    VALUES (v_id, 'Post a photo of your journal entry each day — 7 days required to pass.', 'weekly', 7, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 4. Gratitude Challenge (7/7)
  v_id := NULL;
  INSERT INTO challenges (
    title, description, category, duration_weeks, entry_fee,
    verification_type, start_date, end_date, created_by, status,
    is_recurring, recurring_schedule, next_recurrence,
    is_pro_only, visibility
  ) VALUES (
    'Gratitude',
    'Name one thing you''re grateful for every day. Training your brain to notice the good is one of the most powerful habits you can build. Requirement: write it on a piece of paper, take a photo of what you wrote, and upload that picture as your daily proof.',
    'mindfulness', 1, 10, 'photo', v_start, v_end, v_admin_id, 'upcoming',
    true, 'weekly', v_next_rec, false, 'public'
  )
  ON CONFLICT (title) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
    VALUES (v_id, 'Write one thing you''re grateful for on paper each day, photograph it, and upload the photo — 7 days required to pass.', 'weekly', 7, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 5. Go Outside Challenge (7/7)
  v_id := NULL;
  INSERT INTO challenges (
    title, description, category, duration_weeks, entry_fee,
    verification_type, start_date, end_date, created_by, status,
    is_recurring, recurring_schedule, next_recurrence,
    is_pro_only, visibility
  ) VALUES (
    'Go Outside',
    'Get some fresh air and daylight every single day. This challenge is simple, but sticking to it consistently is where the real growth happens.',
    'wellness', 1, 10, 'photo', v_start, v_end, v_admin_id, 'upcoming',
    true, 'weekly', v_next_rec, false, 'public'
  )
  ON CONFLICT (title) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
    VALUES (v_id, 'Post a photo taken outdoors each day — 7 days required to pass.', 'weekly', 7, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 6. Accountability Starter (5/7)
  v_id := NULL;
  INSERT INTO challenges (
    title, description, category, duration_weeks, entry_fee,
    verification_type, start_date, end_date, created_by, status,
    is_recurring, recurring_schedule, next_recurrence,
    is_pro_only, visibility
  ) VALUES (
    'Accountability Starter',
    'Do one productive thing each day, at least 5 days this week. Define your own win and show up for it — that''s how accountability begins.',
    'productivity', 1, 10, 'photo', v_start, v_end, v_admin_id, 'upcoming',
    true, 'weekly', v_next_rec, false, 'public'
  )
  ON CONFLICT (title) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
    VALUES (v_id, 'Post a photo or note of your one productive task — at least 5 days out of 7 required to pass.', 'weekly', 5, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 7. 7AM Wake Up Challenge (5/7)
  v_id := NULL;
  INSERT INTO challenges (
    title, description, category, duration_weeks, entry_fee,
    verification_type, start_date, end_date, created_by, status,
    is_recurring, recurring_schedule, next_recurrence,
    is_pro_only, visibility
  ) VALUES (
    '7AM Wake Up',
    'Set your alarm and own your morning at least 5 days this week. Waking up early is a choice that compounds — start making it now.',
    'wellness', 1, 10, 'photo', v_start, v_end, v_admin_id, 'upcoming',
    true, 'weekly', v_next_rec, false, 'public'
  )
  ON CONFLICT (title) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
    VALUES (v_id, 'Post a screenshot of your phone clock showing 7:00 AM or earlier — at least 5 days out of 7 required to pass.', 'weekly', 5, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ────────────────────────────────────────────────────────────────
  -- PRO CHALLENGES
  -- ────────────────────────────────────────────────────────────────

  -- 8. 6AM Club Challenge (5/7)
  v_id := NULL;
  INSERT INTO challenges (
    title, description, category, duration_weeks, entry_fee,
    verification_type, start_date, end_date, created_by, status,
    is_recurring, recurring_schedule, next_recurrence,
    is_pro_only, visibility
  ) VALUES (
    '6AM Club',
    'Rise before the world does, 5 days this week. The 6AM Club isn''t about suffering — it''s about claiming focused hours before the noise starts.',
    'wellness', 1, 10, 'photo', v_start, v_end, v_admin_id, 'upcoming',
    true, 'weekly', v_next_rec, true, 'public'
  )
  ON CONFLICT (title) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
    VALUES (v_id, 'Post a screenshot of your phone clock showing 6:00 AM or earlier — at least 5 days out of 7 required to pass.', 'weekly', 5, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 9. No Junk Food Challenge (7/7)
  v_id := NULL;
  INSERT INTO challenges (
    title, description, category, duration_weeks, entry_fee,
    verification_type, start_date, end_date, created_by, status,
    is_recurring, recurring_schedule, next_recurrence,
    is_pro_only, visibility
  ) VALUES (
    'No Junk Food',
    'Seven days of clean eating. No processed junk, no excuses. Document your meals and show your discipline one photo at a time.',
    'nutrition', 1, 10, 'photo', v_start, v_end, v_admin_id, 'upcoming',
    true, 'weekly', v_next_rec, true, 'public'
  )
  ON CONFLICT (title) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
    VALUES (v_id, 'Post a photo of every meal showing no junk food — 7 days required to pass.', 'weekly', 7, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 10. Reduce Social Media Challenge (7/7)
  v_id := NULL;
  INSERT INTO challenges (
    title, description, category, duration_weeks, entry_fee,
    verification_type, start_date, end_date, created_by, status,
    is_recurring, recurring_schedule, next_recurrence,
    is_pro_only, visibility
  ) VALUES (
    'Reduce Social Media',
    'Limit scrolling every day this week. Log your screen time, set a cap, and prove you control the phone — not the other way around.',
    'wellness', 1, 10, 'photo', v_start, v_end, v_admin_id, 'upcoming',
    true, 'weekly', v_next_rec, true, 'public'
  )
  ON CONFLICT (title) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
    VALUES (v_id, 'Post a daily screenshot of your screen time showing reduced social media usage — 7 days required to pass.', 'weekly', 7, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 11. Daily Sweat Challenge (5/7)
  v_id := NULL;
  INSERT INTO challenges (
    title, description, category, duration_weeks, entry_fee,
    verification_type, start_date, end_date, created_by, status,
    is_recurring, recurring_schedule, next_recurrence,
    is_pro_only, visibility
  ) VALUES (
    'Daily Sweat',
    'Break a sweat at least 5 times this week. Any workout counts — what matters is the commitment to show up and push your body.',
    'fitness', 1, 10, 'photo', v_start, v_end, v_admin_id, 'upcoming',
    true, 'weekly', v_next_rec, true, 'public'
  )
  ON CONFLICT (title) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
    VALUES (v_id, 'Post a photo or selfie after your workout — at least 5 days out of 7 required to pass.', 'weekly', 5, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 12. 100 Press Ups Challenge (5/7)
  v_id := NULL;
  INSERT INTO challenges (
    title, description, category, duration_weeks, entry_fee,
    verification_type, start_date, end_date, created_by, status,
    is_recurring, recurring_schedule, next_recurrence,
    is_pro_only, visibility
  ) VALUES (
    '100 Press Ups',
    '100 press-ups, 5 days this week. Split them however you need to, but hit the number. Strength is built one rep at a time.',
    'fitness', 1, 10, 'photo', v_start, v_end, v_admin_id, 'upcoming',
    true, 'weekly', v_next_rec, true, 'public'
  )
  ON CONFLICT (title) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
    VALUES (v_id, 'Post a video or photo proving your 100 press-ups — at least 5 days out of 7 required to pass.', 'weekly', 5, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 13. 100 Squats Challenge (5/7)
  v_id := NULL;
  INSERT INTO challenges (
    title, description, category, duration_weeks, entry_fee,
    verification_type, start_date, end_date, created_by, status,
    is_recurring, recurring_schedule, next_recurrence,
    is_pro_only, visibility
  ) VALUES (
    '100 Squats Challenge',
    '100 squats, 5 days this week. No equipment needed — just your bodyweight and the willingness to turn up every day.',
    'fitness', 1, 10, 'photo', v_start, v_end, v_admin_id, 'upcoming',
    true, 'weekly', v_next_rec, true, 'public'
  )
  ON CONFLICT (title) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
    VALUES (v_id, 'Post a video or photo proving your 100 squats — at least 5 days out of 7 required to pass.', 'weekly', 5, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 14. Mobility Every Day Challenge (4/7)
  v_id := NULL;
  INSERT INTO challenges (
    title, description, category, duration_weeks, entry_fee,
    verification_type, start_date, end_date, created_by, status,
    is_recurring, recurring_schedule, next_recurrence,
    is_pro_only, visibility
  ) VALUES (
    'Mobility Every Day',
    'Stretch and move through your full range of motion at least 4 days this week. Mobility is the foundation every other fitness goal rests on.',
    'fitness', 1, 10, 'photo', v_start, v_end, v_admin_id, 'upcoming',
    true, 'weekly', v_next_rec, true, 'public'
  )
  ON CONFLICT (title) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
    VALUES (v_id, 'Post a photo or short video of your mobility or stretching session — at least 4 days out of 7 required to pass.', 'weekly', 4, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  -- 15. Deep Work Challenge (5/7)
  v_id := NULL;
  INSERT INTO challenges (
    title, description, category, duration_weeks, entry_fee,
    verification_type, start_date, end_date, created_by, status,
    is_recurring, recurring_schedule, next_recurrence,
    is_pro_only, visibility
  ) VALUES (
    'Deep Work',
    'Log a focused, distraction-free work session at least 5 days this week. No notifications, no switching — just you and the task that matters most.',
    'productivity', 1, 10, 'photo', v_start, v_end, v_admin_id, 'upcoming',
    true, 'weekly', v_next_rec, true, 'public'
  )
  ON CONFLICT (title) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    INSERT INTO challenge_requirements (challenge_id, requirement_text, frequency, target_count, requirement_order)
    VALUES (v_id, 'Post a photo of your deep work setup or a timer showing your focused session — at least 5 days out of 7 required to pass.', 'weekly', 5, 1)
    ON CONFLICT DO NOTHING;
  END IF;

END $$;
