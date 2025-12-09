-- Set Daily Smile Challenge to daily recurring with schedule
UPDATE challenges
SET 
  is_recurring = true,
  recurring_schedule = 'daily',
  next_recurrence = (DATE_TRUNC('day', NOW()) + INTERVAL '1 day' + INTERVAL '13 hours')::TIMESTAMPTZ
WHERE title ILIKE '%smile%'
RETURNING 
  id,
  title,
  is_recurring,
  recurring_schedule,
  next_recurrence,
  start_date,
  end_date;

