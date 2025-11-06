# Pillar Progress System - Database Setup

## Overview

The Pillar Progress System tracks user progression across 5 pillars through completing habits and actions in the app.

## Installation Steps

### 1. Create Tables

Run these SQL files in order in your Supabase SQL Editor:

```sql
-- 1. Create user_login_days table (if not exists)
-- File: create_user_login_days_table.sql
```

```sql
-- 2. Create pillar_progress table
-- File: create_pillar_progress_table.sql
```

### 2. Initialize Existing Users

After creating the tables, initialize pillar records for existing users:

```sql
-- File: initialize_existing_users_pillars.sql
```

This will create 5 pillar records (strength_fitness, growth_wisdom, discipline, team_spirit, overall) for each existing user with 35% initial progress.

### 3. Verify Setup

Run this query to verify the tables were created correctly:

```sql
-- Check pillar_progress table
SELECT * FROM pillar_progress LIMIT 5;

-- Check user_login_days table
SELECT * FROM user_login_days LIMIT 5;

-- Count users with pillar progress
SELECT COUNT(DISTINCT user_id) as users_with_pillars FROM pillar_progress;
```

## Pillar Mapping

1. **Strength & Fitness** (dumbbell icon): gym, run, cold_shower, water
2. **Growth & Wisdom** (brain icon): meditation, microlearn, reflect, focus
3. **Discipline** (lock icon): sleep, login_streak (>3 days), update_goal, detox
4. **Team Spirit** (star icon): like, comment, share
5. **Overall** (fire icon): average of other 4 pillars

## Mechanics

- **Increment**: +0.36% per action
- **Max per day**: 2 actions per pillar = 0.72% max daily increase
- **Decay**: -0.36% per day after 3 days of inactivity
- **Range**: 0-100%
- **Initial**: 35% for all pillars

## Troubleshooting

### Error: Journey Modal Stuck Loading / "Query timeout after 8 seconds"

If the journey section keeps loading or times out:

**Quick Fix:**
```sql
-- Run this in Supabase SQL Editor:
-- File: add_daily_posts_indexes.sql
```

This adds critical indexes to the `daily_posts` table for fast queries. Also check:
1. Run `check_daily_posts_rls.sql` to verify table exists
2. Run `fix_daily_posts_rls.sql` if RLS policies are misconfigured
3. Verify the table has proper permissions

**Root Cause:** Missing indexes on `user_id` and `date` columns cause full table scans.

### Error: "new row violates row-level security policy (USING expression) for table user_login_days"

This is a common error - the RLS policies need an UPDATE policy for upsert operations:

**Quick Fix:**
```sql
-- Run this in Supabase SQL Editor:
-- File: fix_user_login_days_rls.sql
```

Or manually run:
```sql
CREATE POLICY "Users can update their own login days"
  ON user_login_days
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

This stops the console spam immediately.

### Error: "user_login_days table does not exist"

If you see this error in the app logs:
1. Run `create_user_login_days_table.sql`
2. Restart the app

### Error: "relation pillar_progress does not exist"

If you see this error:
1. Run `create_pillar_progress_table.sql`
2. Run `initialize_existing_users_pillars.sql`
3. Restart the app

### RLS Policies Not Working

If users can't read/write their own data:
1. Verify RLS is enabled: `ALTER TABLE pillar_progress ENABLE ROW LEVEL SECURITY;`
2. Check policies exist: `SELECT * FROM pg_policies WHERE tablename = 'pillar_progress';`
3. Verify user is authenticated: Check `auth.uid()` returns a value

## Monitoring

Query to see pillar progress across all users:

```sql
SELECT 
  pillar_type,
  ROUND(AVG(progress_percentage), 2) as avg_progress,
  ROUND(MIN(progress_percentage), 2) as min_progress,
  ROUND(MAX(progress_percentage), 2) as max_progress
FROM pillar_progress
GROUP BY pillar_type
ORDER BY pillar_type;
```

Query to see most active users:

```sql
SELECT 
  u.email,
  pp.pillar_type,
  pp.progress_percentage,
  pp.last_activity_date,
  pp.actions_today
FROM pillar_progress pp
JOIN auth.users u ON u.id = pp.user_id
WHERE pp.last_activity_date = CURRENT_DATE
AND pp.actions_today > 0
ORDER BY pp.progress_percentage DESC
LIMIT 20;
```

