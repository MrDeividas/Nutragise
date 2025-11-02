-- Add/Update public.users → auth.users Foreign Key with CASCADE DELETE
-- This is the MISSING LINK that's blocking user deletion!

-- Step 1: Drop existing constraint if it exists (might not have CASCADE)
DO $$
DECLARE
    existing_constraint TEXT;
BEGIN
    -- Find existing constraint name
    SELECT tc.constraint_name INTO existing_constraint
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE 
        tc.table_schema = 'public'
        AND tc.table_name = 'users'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'id'
        AND ccu.table_schema = 'auth'
        AND ccu.table_name = 'users'
    LIMIT 1;
    
    -- Drop it if it exists
    IF existing_constraint IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', existing_constraint);
        RAISE NOTICE '✅ Dropped existing constraint: %', existing_constraint;
    ELSE
        RAISE NOTICE '⚠️ No existing constraint found - will create new one';
    END IF;
END $$;

-- Step 2: Add foreign key with CASCADE DELETE
-- This is the critical link: public.users → auth.users
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.users 
        ADD CONSTRAINT public_users_auth_users_fkey
        FOREIGN KEY (id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE '✅ SUCCESS: Added public.users → auth.users with CASCADE DELETE';
        RAISE NOTICE '   Now deleting from auth.users will automatically delete from public.users';
        RAISE NOTICE '   Which will then cascade to: followers, goals, posts, progress_photos';
    EXCEPTION 
        WHEN duplicate_object THEN
            RAISE NOTICE '⚠️ Constraint already exists with this name';
        WHEN OTHERS THEN
            RAISE NOTICE '❌ Error: %', SQLERRM;
            RAISE NOTICE '   SQLSTATE: %', SQLSTATE;
    END;
END $$;

-- Step 3: Verify it was created
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.referential_constraints rc
                ON tc.constraint_name = rc.constraint_name
            WHERE tc.table_schema = 'public'
            AND tc.table_name = 'users'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND rc.delete_rule = 'CASCADE'
        ) THEN '✅ VERIFIED: public.users → auth.users exists with CASCADE'
        ELSE '❌ FAILED: Constraint not found or delete rule is not CASCADE'
    END AS verification;

