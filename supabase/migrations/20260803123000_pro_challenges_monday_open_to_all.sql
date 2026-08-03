-- 1) Align remaining weekly system challenges (incl. former Pro) to Monday–Sunday.
-- 2) Open all system challenges so everyone can join (clear is_pro_only).

UPDATE challenges
SET
  start_date = (
    (
      (start_date AT TIME ZONE 'UTC')::date
      + ((1 - EXTRACT(DOW FROM start_date AT TIME ZONE 'UTC')::int + 7) % 7)
      + TIME '00:01:00'
    ) AT TIME ZONE 'UTC'
  ),
  end_date = (
    (
      (start_date AT TIME ZONE 'UTC')::date
      + ((1 - EXTRACT(DOW FROM start_date AT TIME ZONE 'UTC')::int + 7) % 7)
      + 6
      + TIME '23:59:59.999'
    ) AT TIME ZONE 'UTC'
  ),
  next_recurrence = (
    (
      (start_date AT TIME ZONE 'UTC')::date
      + ((1 - EXTRACT(DOW FROM start_date AT TIME ZONE 'UTC')::int + 7) % 7)
      + 7
      + TIME '00:01:00'
    ) AT TIME ZONE 'UTC'
  )
WHERE is_recurring = true
  AND COALESCE(recurring_schedule, 'weekly') = 'weekly'
  AND COALESCE(is_user_created, false) = false
  AND status IN ('active', 'upcoming')
  AND end_date >= NOW() - INTERVAL '1 day'
  AND EXTRACT(DOW FROM start_date AT TIME ZONE 'UTC')::int <> 1;

UPDATE challenges
SET is_pro_only = false
WHERE COALESCE(is_user_created, false) = false
  AND COALESCE(is_pro_only, false) = true;
