-- Comprehensive Fix: Handle ALL potential blockers for user deletion
-- Run this to fix everything at once

-- STEP 1: Fix public.users → auth.users (Critical!)
DO $$
DECLARE
    c_name TEXT;
BEGIN
    -- Drop ALL possible constraint names
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS public_users_id_fkey;
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS public_users_auth_users_fkey;
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS public_users_auth_users_cascade;
    
    -- Find and drop any existing constraint
    FOR c_name IN
        SELECT tc.constraint_name 
        FROM information_schema.table_constraints tc
        WHERE tc.table_schema = 'public'
        AND tc.table_name = 'users'
        AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
        EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS %I', c_name);
    END LOOP;
    
    -- Add with CASCADE
    BEGIN
        ALTER TABLE public.users 
        ADD CONSTRAINT public_users_auth_users_cascade
        FOREIGN KEY (id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
        RAISE NOTICE '✅ Step 1: Added public.users → auth.users with CASCADE';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE '⚠️ public.users constraint already exists';
    END;
END $$;

-- STEP 2: Fix profiles table (if it references auth.users directly)
DO $$
DECLARE
    prof_constraint TEXT;
BEGIN
    -- Check if profiles references auth.users
    SELECT tc.constraint_name INTO prof_constraint
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
    WHERE tc.table_schema = 'public'
    AND tc.table_name = 'profiles'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND ccu.table_schema = 'auth'
    AND ccu.table_name = 'users'
    LIMIT 1;
    
    IF prof_constraint IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', prof_constraint);
        RAISE NOTICE 'Dropped profiles constraint: %', prof_constraint;
    END IF;
    
    -- Add with CASCADE (always add, even if constraint didn't exist)
    BEGIN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_auth_users_cascade
        FOREIGN KEY (id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
        RAISE NOTICE '✅ Step 2: Added profiles → auth.users with CASCADE';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE '⚠️ profiles constraint already exists';
    END;
END $$;

-- STEP 3: Fix ALL tables that might reference auth.users directly
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        SELECT DISTINCT
            tc.table_schema,
            tc.table_name,
            tc.constraint_name,
            kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE 
            tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            AND ccu.table_schema = 'auth'
            AND ccu.table_name = 'users'
            AND tc.table_name NOT IN ('users')  -- Already fixed above
        ORDER BY tc.table_name
    LOOP
        -- Drop existing
        BEGIN
            EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I',
                rec.table_schema,
                rec.table_name,
                rec.constraint_name
            );
            RAISE NOTICE 'Dropped: %.%', rec.table_name, rec.constraint_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop %.%: %', rec.table_name, rec.constraint_name, SQLERRM;
        END;
        
        -- Add with CASCADE
        BEGIN
            EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I_cascade FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE',
                rec.table_schema,
                rec.table_name,
                rec.constraint_name,
                rec.column_name
            );
            RAISE NOTICE '✅ Fixed %.% → auth.users with CASCADE', rec.table_name, rec.column_name;
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Constraint already exists for %.%', rec.table_name, rec.column_name;
        END;
    END LOOP;
END $$;

-- STEP 4: Verify final state
SELECT 'FINAL VERIFICATION - All Foreign Keys:' AS status;
SELECT
    tc.table_schema || '.' || tc.table_name AS table_name,
    kcu.column_name,
    ccu.table_schema || '.' || ccu.table_name AS references_table,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ READY'
        ELSE '❌ STILL BLOCKING'
    END AS status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
    ON rc.constraint_name = tc.constraint_name
    AND rc.constraint_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY'
    AND (
        (ccu.table_name = 'users' AND ccu.table_schema = 'auth')
        OR (ccu.table_name = 'users' AND ccu.table_schema = 'public')
    )
ORDER BY 
    CASE WHEN ccu.table_schema = 'auth' THEN 1 ELSE 2 END,
    tc.table_name;

-- STEP 5: Critical check
SELECT 
    'CRITICAL VERIFICATION:' AS check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.referential_constraints rc
                ON tc.constraint_name = rc.constraint_name
            WHERE tc.table_schema = 'public'
            AND tc.table_name = 'users'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND rc.delete_rule = 'CASCADE'
        ) THEN '✅ public.users → auth.users: EXISTS WITH CASCADE'
        ELSE '❌ public.users → auth.users: MISSING OR NO CASCADE'
    END AS public_users_check,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.referential_constraints rc
                ON tc.constraint_name = rc.constraint_name
            WHERE tc.table_schema = 'public'
            AND tc.table_name = 'profiles'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND rc.delete_rule = 'CASCADE'
        ) THEN '✅ profiles → auth.users: EXISTS WITH CASCADE'
        ELSE '⚠️ profiles → auth.users: Check if needed'
    END AS profiles_check;

