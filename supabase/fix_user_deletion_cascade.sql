-- Fix User Deletion: Add CASCADE DELETE to Foreign Key Constraints
-- This allows users to be deleted from auth.users, which will automatically delete related records

-- Step 1: Check which tables reference auth.users
-- Run this query first to see all foreign key constraints:
/*
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND (ccu.table_name = 'users' OR ccu.table_name = 'auth.users')
ORDER BY tc.table_name;
*/

-- Step 2: Update foreign keys to use CASCADE DELETE
-- This will automatically delete related records when a user is deleted

-- Update profiles table (if it references auth.users)
DO $$
BEGIN
    -- Check if foreign key exists and update it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%profiles%user%' 
        AND table_name = 'profiles'
    ) THEN
        -- Drop existing constraint
        ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
        -- Recreate with CASCADE
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_id_fkey 
        FOREIGN KEY (id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Update users table (if it references auth.users)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%users%user%' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;
        ALTER TABLE users 
        ADD CONSTRAINT users_id_fkey 
        FOREIGN KEY (id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Update goals table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%goals%user%' 
        AND table_name = 'goals'
    ) THEN
        ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_user_id_fkey;
        ALTER TABLE goals 
        ADD CONSTRAINT goals_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Update posts table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%posts%user%' 
        AND table_name = 'posts'
    ) THEN
        ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
        ALTER TABLE posts 
        ADD CONSTRAINT posts_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Update daily_posts table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%daily_posts%user%' 
        AND table_name = 'daily_posts'
    ) THEN
        ALTER TABLE daily_posts DROP CONSTRAINT IF EXISTS daily_posts_user_id_fkey;
        ALTER TABLE daily_posts 
        ADD CONSTRAINT daily_posts_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Update progress_photos table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%progress_photos%user%' 
        AND table_name = 'progress_photos'
    ) THEN
        ALTER TABLE progress_photos DROP CONSTRAINT IF EXISTS progress_photos_user_id_fkey;
        ALTER TABLE progress_photos 
        ADD CONSTRAINT progress_photos_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Update challenges table (if host_id references users)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%challenges%host%' 
        AND table_name = 'challenges'
    ) THEN
        ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_host_id_fkey;
        ALTER TABLE challenges 
        ADD CONSTRAINT challenges_host_id_fkey 
        FOREIGN KEY (host_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Update challenge_participants table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%challenge_participants%user%' 
        AND table_name = 'challenge_participants'
    ) THEN
        ALTER TABLE challenge_participants DROP CONSTRAINT IF EXISTS challenge_participants_user_id_fkey;
        ALTER TABLE challenge_participants 
        ADD CONSTRAINT challenge_participants_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Update challenge_submissions table (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%challenge_submissions%user%' 
        AND table_name = 'challenge_submissions'
    ) THEN
        ALTER TABLE challenge_submissions DROP CONSTRAINT IF EXISTS challenge_submissions_user_id_fkey;
        ALTER TABLE challenge_submissions 
        ADD CONSTRAINT challenge_submissions_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Update follows table (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%follows%' 
        AND table_name = 'follows'
    ) THEN
        ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_follower_id_fkey;
        ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_following_id_fkey;
        
        ALTER TABLE follows 
        ADD CONSTRAINT follows_follower_id_fkey 
        FOREIGN KEY (follower_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
        
        ALTER TABLE follows 
        ADD CONSTRAINT follows_following_id_fkey 
        FOREIGN KEY (following_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Update notifications table (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%notifications%user%' 
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
        ALTER TABLE notifications 
        ADD CONSTRAINT notifications_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Update direct_messages table (if exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%direct_messages%' 
        AND table_name = 'direct_messages'
    ) THEN
        ALTER TABLE direct_messages DROP CONSTRAINT IF EXISTS direct_messages_sender_id_fkey;
        ALTER TABLE direct_messages DROP CONSTRAINT IF EXISTS direct_messages_recipient_id_fkey;
        
        ALTER TABLE direct_messages 
        ADD CONSTRAINT direct_messages_sender_id_fkey 
        FOREIGN KEY (sender_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
        
        ALTER TABLE direct_messages 
        ADD CONSTRAINT direct_messages_recipient_id_fkey 
        FOREIGN KEY (recipient_id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- Note: After running this migration, deleting a user from auth.users will automatically
-- delete all related records in the tables above. This is useful for data cleanup but
-- be careful as it's irreversible!

