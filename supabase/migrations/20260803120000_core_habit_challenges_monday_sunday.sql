-- Align core habit weekly challenges to Monday–Sunday.
-- These recurring weeks previously started on Saturday and ended Friday.
-- Shift active/upcoming Saturday-start weeks forward to Monday–Sunday.

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
  AND EXTRACT(DOW FROM start_date AT TIME ZONE 'UTC')::int = 6; -- Saturday
