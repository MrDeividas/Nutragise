-- Grant Pro + seed improving week-on-week Insights data for deividasggg
-- user: 5207606a-c01f-4450-84cd-4a6a3ae982aa

DO $$
DECLARE
  v_uid uuid := '5207606a-c01f-4450-84cd-4a6a3ae982aa';
BEGIN
  UPDATE public.profiles
  SET is_pro = true
  WHERE id = v_uid;

  DELETE FROM public.daily_habits
  WHERE user_id = v_uid
    AND date BETWEEN '2026-07-27' AND '2026-08-13';

  DELETE FROM public.user_points_daily
  WHERE user_id = v_uid
    AND date BETWEEN '2026-07-27' AND '2026-08-13';

  DELETE FROM public.meditation_sessions
  WHERE user_id = v_uid
    AND completed_at::date BETWEEN '2026-07-27' AND '2026-08-13';

  -- 2 weeks ago ~33% | last week ~64% | this week ~87%
  -- reflect_* scales are 1–5; sleep_quality is 0–100
  INSERT INTO public.daily_habits (
    user_id, date,
    sleep_hours, sleep_quality, sleep_bedtime_hours, sleep_bedtime_minutes, sleep_wakeup_hours, sleep_wakeup_minutes,
    water_intake, water_goal,
    run_day_type, run_activity_type, run_distance, run_duration,
    gym_day_type, gym_training_types, gym_duration,
    reflect_mood, reflect_energy, reflect_motivation, reflect_stress, reflect_what_went_well,
    cold_shower_completed
  ) VALUES
  -- 2 weeks ago
  (v_uid, '2026-07-27', 6, 55, 0, 30, 6, 30, 4, '2.5', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false),
  (v_uid, '2026-07-28', 6, 55, 0, 45, 7, 0, NULL, NULL, NULL, NULL, NULL, NULL, 'active', ARRAY['strength'], '45', NULL, NULL, NULL, NULL, NULL, false),
  (v_uid, '2026-07-29', NULL, NULL, NULL, NULL, NULL, NULL, 5, '2.5', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3, 2, 2, 4, 'Got through the day', false),
  (v_uid, '2026-07-30', 6, 50, 1, 0, 7, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false),
  (v_uid, '2026-07-31', NULL, NULL, NULL, NULL, NULL, NULL, 4, '2.5', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true),
  (v_uid, '2026-08-01', 7, 58, 0, 15, 7, 15, NULL, NULL, NULL, NULL, NULL, NULL, 'active', ARRAY['hypertrophy'], '50', NULL, NULL, NULL, NULL, NULL, false),
  (v_uid, '2026-08-02', NULL, NULL, NULL, NULL, NULL, NULL, 5, '2.5', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false),
  -- last week
  (v_uid, '2026-08-03', 7, 68, 23, 30, 6, 45, 6, '2.5', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4, 3, 3, 3, 'Solid start to the week', true),
  (v_uid, '2026-08-04', 7, 70, 23, 20, 6, 40, 7, '2.5', NULL, NULL, NULL, NULL, 'active', ARRAY['strength'], '55', 4, 4, 4, 2, 'Strong gym session', false),
  (v_uid, '2026-08-05', 7, 72, 23, 15, 6, 30, 7, '2.5', 'active', 'run', 4.2, '32', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, true),
  (v_uid, '2026-08-06', 7, 70, 23, 25, 6, 45, 6, '2.5', NULL, NULL, NULL, NULL, 'active', ARRAY['push'], '50', 4, 4, 4, 2, 'Consistent day', false),
  (v_uid, '2026-08-07', 8, 75, 23, 10, 6, 30, 8, '2.5', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4, 4, 4, 2, 'Felt focused', false),
  (v_uid, '2026-08-08', 7, 72, 23, 30, 7, 0, 7, '2.5', NULL, NULL, NULL, NULL, 'active', ARRAY['legs'], '60', NULL, NULL, NULL, NULL, NULL, true),
  (v_uid, '2026-08-09', 8, 78, 23, 0, 7, 0, 6, '2.5', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 4, 4, 4, 2, 'Good recovery Sunday', false),
  -- this week
  (v_uid, '2026-08-10', 8, 88, 22, 45, 6, 15, 8, '2.5', 'active', 'run', 5.0, '28', 'active', ARRAY['strength'], '55', 5, 5, 5, 1, 'Best Monday in weeks', true),
  (v_uid, '2026-08-11', 8, 90, 22, 50, 6, 20, 9, '2.5', NULL, NULL, NULL, NULL, 'active', ARRAY['pull'], '50', 5, 5, 5, 1, 'Locked in', true),
  (v_uid, '2026-08-12', 8, 92, 22, 40, 6, 10, 9, '2.5', 'active', 'walk', 6.5, '55', 'active', ARRAY['legs'], '60', 5, 5, 5, 1, 'Energy through the roof', true),
  (v_uid, '2026-08-13', 8, 90, 22, 45, 6, 15, 8, '2.5', 'active', 'run', 5.5, '30', 'active', ARRAY['push'], '45', 5, 5, 5, 1, 'Still climbing', true);

  INSERT INTO public.user_points_daily (
    user_id, date,
    sleep_completed, water_completed, run_completed, gym_completed, reflect_completed, cold_shower_completed,
    meditation_completed, microlearn_completed,
    liked_today, commented_today, shared_today, updated_goal_today,
    daily_habits_points, core_habits_points, bonus_points, total_points_today
  ) VALUES
  (v_uid, '2026-07-27', true, true, false, false, false, false, false, false, false, false, false, false, 20, 0, 0, 20),
  (v_uid, '2026-07-28', true, false, false, true, false, false, false, false, false, false, false, false, 20, 0, 0, 20),
  (v_uid, '2026-07-29', false, true, false, false, true, false, false, false, false, false, false, false, 20, 0, 0, 20),
  (v_uid, '2026-07-30', true, false, false, false, false, false, false, false, false, false, false, false, 10, 0, 0, 10),
  (v_uid, '2026-07-31', false, true, false, false, false, true, false, false, false, false, false, false, 20, 0, 0, 20),
  (v_uid, '2026-08-01', true, false, false, true, false, false, false, false, false, false, false, false, 20, 0, 0, 20),
  (v_uid, '2026-08-02', false, true, false, false, false, false, false, false, false, false, false, false, 10, 0, 0, 10),
  (v_uid, '2026-08-03', true, true, false, false, true, true, false, false, true, false, false, true, 40, 20, 0, 60),
  (v_uid, '2026-08-04', true, true, false, true, true, false, false, false, true, false, false, false, 40, 10, 0, 50),
  (v_uid, '2026-08-05', true, true, true, false, false, true, false, false, false, true, false, false, 40, 10, 0, 50),
  (v_uid, '2026-08-06', true, true, false, true, true, false, false, false, true, false, false, true, 40, 20, 0, 60),
  (v_uid, '2026-08-07', true, true, false, false, true, false, false, false, false, false, false, false, 30, 0, 0, 30),
  (v_uid, '2026-08-08', true, true, false, true, false, true, false, false, true, false, false, false, 40, 10, 0, 50),
  (v_uid, '2026-08-09', true, true, false, false, true, false, false, false, false, false, false, false, 30, 0, 0, 30),
  (v_uid, '2026-08-10', true, true, true, true, true, true, true, false, true, true, false, true, 60, 30, 10, 100),
  (v_uid, '2026-08-11', true, true, false, true, true, true, true, false, true, false, false, true, 50, 20, 10, 80),
  (v_uid, '2026-08-12', true, true, true, true, true, true, true, false, true, true, true, true, 60, 40, 10, 110),
  (v_uid, '2026-08-13', true, true, true, true, true, true, true, false, true, false, false, true, 60, 20, 10, 90)
  ON CONFLICT (user_id, date) DO UPDATE SET
    sleep_completed = EXCLUDED.sleep_completed,
    water_completed = EXCLUDED.water_completed,
    run_completed = EXCLUDED.run_completed,
    gym_completed = EXCLUDED.gym_completed,
    reflect_completed = EXCLUDED.reflect_completed,
    cold_shower_completed = EXCLUDED.cold_shower_completed,
    meditation_completed = EXCLUDED.meditation_completed,
    daily_habits_points = EXCLUDED.daily_habits_points,
    core_habits_points = EXCLUDED.core_habits_points,
    bonus_points = EXCLUDED.bonus_points,
    total_points_today = EXCLUDED.total_points_today,
    updated_at = now();

  INSERT INTO public.user_login_days (user_id, login_date)
  SELECT v_uid, d::date
  FROM generate_series('2026-07-27'::date, '2026-08-13'::date, '1 day'::interval) AS d
  ON CONFLICT (user_id, login_date) DO NOTHING;

  INSERT INTO public.meditation_sessions (user_id, session_title, duration_minutes, completed_at)
  VALUES
    (v_uid, 'Focus breath', 12, '2026-08-10 07:30:00+00'),
    (v_uid, 'Morning calm', 15, '2026-08-11 07:20:00+00'),
    (v_uid, 'Reset', 10, '2026-08-12 21:00:00+00'),
    (v_uid, 'Clarity', 18, '2026-08-13 07:10:00+00');

  UPDATE public.pillar_progress
  SET progress_percentage = CASE pillar_type
      WHEN 'strength_fitness' THEN 62
      WHEN 'growth_wisdom' THEN 58
      WHEN 'discipline' THEN 71
      WHEN 'team_spirit' THEN 54
      WHEN 'overall' THEN 61
      ELSE progress_percentage
    END,
    updated_at = now()
  WHERE user_id = v_uid;
END $$;
