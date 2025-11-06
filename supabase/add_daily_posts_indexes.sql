-- Add indexes to daily_posts table for faster journey queries
-- Run this to fix slow/hanging journey modal queries

-- Index on user_id for fast user lookups
CREATE INDEX IF NOT EXISTS idx_daily_posts_user_id 
ON daily_posts(user_id);

-- Composite index on user_id and date for ordered queries
CREATE INDEX IF NOT EXISTS idx_daily_posts_user_date 
ON daily_posts(user_id, date DESC);

-- Index on created_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_daily_posts_created_at 
ON daily_posts(created_at DESC);

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'daily_posts'
ORDER BY indexname;

