-- Clear all existing posts to start fresh with the new social feed
-- Run this in Supabase SQL Editor to delete all old posts

-- Delete all posts
DELETE FROM posts;

-- Optional: Reset the auto-increment if you want IDs to start from 1 again
-- (Only uncomment if you're sure you want to reset IDs)
-- ALTER SEQUENCE posts_id_seq RESTART WITH 1;

-- Verify deletion
SELECT COUNT(*) as remaining_posts FROM posts;

