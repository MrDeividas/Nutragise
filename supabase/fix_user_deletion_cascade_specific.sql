-- Fix User Deletion: Add CASCADE DELETE based on actual foreign key findings
-- These tables reference public.users:
-- - followers (follower_id, following_id)
-- - goals (user_id)
-- - posts (user_id)
-- - progress_photos (user_id)

-- First, ensure public.users has CASCADE DELETE from auth.users
-- This is critical - if public.users blocks deletion from auth.users, nothing else matters

DO $$
BEGIN
    -- Check if public.users.id references auth.users.id
    -- If not, we need to add it first
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Drop existing constraint on public.users if it exists
        ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
        
        -- Recreate with CASCADE DELETE from auth.users
        ALTER TABLE public.users 
        ADD CONSTRAINT users_id_fkey 
        FOREIGN KEY (id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Updated public.users foreign key to CASCADE DELETE from auth.users';
    ELSE
        -- If no foreign key exists, add it
        ALTER TABLE public.users 
        ADD CONSTRAINT users_id_fkey 
        FOREIGN KEY (id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added public.users foreign key with CASCADE DELETE from auth.users';
    END IF;
END $$;

-- Fix followers table (both follower_id and following_id)
DO $$
BEGIN
    -- Update follower_id foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'followers' 
        AND constraint_name LIKE '%follower%'
    ) THEN
        ALTER TABLE followers DROP CONSTRAINT IF EXISTS followers_follower_id_fkey;
        ALTER TABLE followers 
        ADD CONSTRAINT followers_follower_id_fkey 
        FOREIGN KEY (follower_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Updated followers.follower_id to CASCADE DELETE';
    END IF;
    
    -- Update following_id foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'followers' 
        AND constraint_name LIKE '%following%'
    ) THEN
        ALTER TABLE followers DROP CONSTRAINT IF EXISTS followers_following_id_fkey;
        ALTER TABLE followers 
        ADD CONSTRAINT followers_following_id_fkey 
        FOREIGN KEY (following_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Updated followers.following_id to CASCADE DELETE';
    END IF;
END $$;

-- Fix goals table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'goals' 
        AND constraint_name LIKE '%user%'
    ) THEN
        ALTER TABLE goals DROP CONSTRAINT IF EXISTS goals_user_id_fkey;
        ALTER TABLE goals 
        ADD CONSTRAINT goals_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Updated goals.user_id to CASCADE DELETE';
    END IF;
END $$;

-- Fix posts table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'posts' 
        AND constraint_name LIKE '%user%'
    ) THEN
        ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_fkey;
        ALTER TABLE posts 
        ADD CONSTRAINT posts_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Updated posts.user_id to CASCADE DELETE';
    END IF;
END $$;

-- Fix progress_photos table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'progress_photos' 
        AND constraint_name LIKE '%user%'
    ) THEN
        ALTER TABLE progress_photos DROP CONSTRAINT IF EXISTS progress_photos_user_id_fkey;
        ALTER TABLE progress_photos 
        ADD CONSTRAINT progress_photos_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.users(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Updated progress_photos.user_id to CASCADE DELETE';
    END IF;
END $$;

-- Verify the changes
SELECT
    'After migration - Foreign keys with CASCADE:' AS status,
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS references_table,
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
    AND ccu.table_name = 'users'
    AND ccu.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

