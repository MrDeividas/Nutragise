-- Rename legacy "Daily Smile" challenge titles (optional 😊 and/or trailing "Challenge") to "Be Happy".
-- Safe to run repeatedly; rows already titled "Be Happy" are unchanged.

UPDATE challenges
SET title = 'Be Happy'
WHERE lower(
  trim(
    regexp_replace(
      trim(regexp_replace(trim(title), E'😊', '', 'g')),
      '[[:space:]]+challenge$',
      '',
      'i'
    )
  )
) = 'daily smile';
