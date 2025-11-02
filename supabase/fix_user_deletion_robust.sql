-- Robust Fix for User Deletion - Handles All Constraint Names Dynamically
-- This script will find and fix ALL foreign key constraints automatically

-- Step 1: Show current state BEFORE fixes
SELECT 'BEFORE FIXES - Current Foreign Key Constraints:' AS status;
SELECT
    tc.table_schema || '.' || tc.table_name AS table_name,
    kcu.column_name,
    tc.constraint_name,
    ccu.table_schema || '.' || ccu.table_name AS references_table,
    rc.delete_rule AS current_delete_rule
FROM 
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
        AND rc.constraint_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY'
    AND (
        (ccu.table_name = 'users' AND ccu.table_schema = 'public')
        OR (ccu.table_name = 'users' AND ccu.table_schema = 'auth')
    )
ORDER BY tc.table_name, kcu.column_name;

-- Step 2: Fix public.users → auth.users FIRST (Critical!)
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
    
    -- Drop existing constraint if it exists
    IF existing_constraint IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT %I', existing_constraint);
        RAISE NOTICE 'Dropped constraint: %', existing_constraint;
    END IF;
    
    -- Add new constraint with CASCADE
    BEGIN
        ALTER TABLE public.users 
        ADD CONSTRAINT public_users_auth_users_cascade
        FOREIGN KEY (id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
        RAISE NOTICE '✅ Added public.users → auth.users with CASCADE';
    EXCEPTION WHEN duplicate_object THEN
        RAISE NOTICE 'Constraint already exists, continuing...';
    END;
END $$;

-- Step 3: Fix ALL other tables that reference public.users
DO $$
DECLARE
    rec RECORD;
    constraint_name_var TEXT;
    new_constraint_name TEXT;
BEGIN
    FOR rec IN
        SELECT DISTINCT
            tc.table_schema,
            tc.table_name,
            tc.constraint_name,
            kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE 
            tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            AND ccu.table_schema = 'public'
            AND ccu.table_name = 'users'
            AND tc.table_name != 'users'  -- Don't modify users table itself
        ORDER BY tc.table_name, kcu.column_name
    LOOP
        constraint_name_var := rec.constraint_name;
        new_constraint_name := rec.constraint_name || '_cascade';
        
        -- Drop existing constraint
        BEGIN
            EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I',
                rec.table_schema,
                rec.table_name,
                constraint_name_var
            );
            RAISE NOTICE 'Dropped: %.%.%', rec.table_name, rec.column_name, constraint_name_var;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop %.%.%: %', rec.table_name, rec.column_name, constraint_name_var, SQLERRM;
        END;
        
        -- Add new constraint with CASCADE
        BEGIN
            EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %I.users(id) ON DELETE CASCADE',
                rec.table_schema,
                rec.table_name,
                new_constraint_name,
                rec.column_name,
                rec.table_schema
            );
            RAISE NOTICE '✅ Added %.%.% → public.users with CASCADE', rec.table_name, rec.column_name, new_constraint_name;
        EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Constraint % already exists for %.%', new_constraint_name, rec.table_name, rec.column_name;
        END;
    END LOOP;
END $$;

-- Step 4: Check if profiles references auth.users directly
DO $$
DECLARE
    prof_constraint TEXT;
BEGIN
    -- Check if profiles has foreign key to auth.users
    SELECT tc.constraint_name INTO prof_constraint
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE 
        tc.table_schema = 'public'
        AND tc.table_name = 'profiles'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'id'
        AND ccu.table_schema = 'auth'
        AND ccu.table_name = 'users'
    LIMIT 1;
    
    IF prof_constraint IS NOT NULL THEN
        -- Drop and recreate
        EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', prof_constraint);
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_auth_users_cascade
        FOREIGN KEY (id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
        RAISE NOTICE '✅ Updated profiles → auth.users with CASCADE';
    END IF;
END $$;

-- Step 5: Show FINAL state after fixes
SELECT 'AFTER FIXES - All Foreign Key Constraints:' AS status;
SELECT
    tc.table_schema || '.' || tc.table_name AS table_name,
    kcu.column_name,
    tc.constraint_name,
    ccu.table_schema || '.' || ccu.table_name AS references_table,
    rc.delete_rule AS delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ READY'
        ELSE '❌ STILL BLOCKING'
    END AS status
FROM 
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
        AND rc.constraint_schema = tc.table_schema
WHERE 
    tc.constraint_type = 'FOREIGN KEY'
    AND (
        (ccu.table_name = 'users' AND ccu.table_schema = 'public')
        OR (ccu.table_name = 'users' AND ccu.table_schema = 'auth')
    )
ORDER BY tc.table_name, kcu.column_name;

-- Step 6: Verify public.users → auth.users relationship exists
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
        ) THEN '✅ public.users → auth.users has CASCADE'
        ELSE '❌ CRITICAL: public.users → auth.users missing or no CASCADE'
    END AS critical_check;

