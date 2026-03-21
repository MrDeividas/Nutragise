-- Remove a trailing " Challenge" / " challenge" from every challenge title (case-insensitive).
-- Safe to run more than once; already-stripped titles stay the same.
-- Uses regexp_replace flag 'i' (not Perl (?i) — PostgreSQL rejects that).

UPDATE challenges
SET title = trim(regexp_replace(trim(title), '[[:space:]]+challenge$', '', 'i'))
WHERE trim(title) ~* '[[:space:]]+challenge$';
