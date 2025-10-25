-- Clean up duplicate challenges
-- This will remove duplicate challenges and keep only the most recent one of each title

-- First, let's see what duplicates exist
SELECT title, COUNT(*) as count 
FROM challenges 
GROUP BY title 
HAVING COUNT(*) > 1;

-- Delete duplicate challenges, keeping only the most recent one of each title
DELETE FROM challenges 
WHERE id NOT IN (
  SELECT DISTINCT ON (title) id 
  FROM challenges 
  ORDER BY title, created_at DESC
);

-- Also clean up any orphaned requirements that might be left
DELETE FROM challenge_requirements 
WHERE challenge_id NOT IN (
  SELECT id FROM challenges
);

-- Clean up any orphaned participants
DELETE FROM challenge_participants 
WHERE challenge_id NOT IN (
  SELECT id FROM challenges
);

-- Clean up any orphaned submissions
DELETE FROM challenge_submissions 
WHERE challenge_id NOT IN (
  SELECT id FROM challenges
);

-- Verify the cleanup worked
SELECT title, COUNT(*) as count 
FROM challenges 
GROUP BY title;
