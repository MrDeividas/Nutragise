-- Complete Fix for User Deletion - Handles All Cases
-- Run this script to fix user deletion issues

-- Step 1: Find ALL foreign key constraints (including constraint names)
-- This helps us identify the exact constraint names to modify

DO $$
DECLARE
    constraint_record RECORD;
    sql_statement TEXT;
BEGIN
    -- First, let's see what constraints we're dealing with
    RAISE NOTICE '=== FINDING ALL FOREIGN KEY CONSTRAINTS ===';
    
    FOR constraint_record IN
        SELECT 
            tc.table_schema,
            tc.table_name,
            tc.constraint_name,
            kcu.column_name,
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            rc.delete_rule
        FROM information_schema.table_constraints AS tc
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
        ORDER BY tc.table_name, kcu.column_name
    LOOP
        RAISE NOTICE 'Found: %.% (%.%) → %.%.% (delete rule: %)',
            constraint_record.table_schema,
            constraint_record.table_name,
            constraint_record.constraint_name,
            constraint_record.column_name,
            constraint_record.foreign_table_schema,
            constraint_record.foreign_table_name,
            constraint_record.foreign_column_name,
            constraint_record.delete_rule;
    END LOOP;
END $$;

-- Step 2: Fix public.users → auth.users relationship FIRST (this is critical)
-- Check if public.users.id has a foreign key to auth.users
DO $$
BEGIN
    -- Check if constraint exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE 
            tc.table_name = 'users'
            AND tc.table_schema = 'public'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND kcu.column_name = 'id'
            AND ccu.table_schema = 'auth'
            AND ccu.table_name = 'users'
    ) THEN
        -- Get the actual constraint name
        DECLARE
            constraint_name_var TEXT;
        BEGIN
            SELECT tc.constraint_name INTO constraint_name_var
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE 
                tc.table_name = 'users'
                AND tc.table_schema = 'public'
                AND tc.constraint_type = 'FOREIGN KEY'
                AND kcu.column_name = 'id'
                AND ccu.table_schema = 'auth'
                AND ccu.table_name = 'users'
            LIMIT 1;
            
            -- Drop and recreate with CASCADE
            EXECUTE format('ALTER TABLE public.users DROP CONSTRAINT IF EXISTS %I', constraint_name_var);
            ALTER TABLE public.users 
            ADD CONSTRAINT public_users_id_fkey 
            FOREIGN KEY (id) 
            REFERENCES auth.users(id) 
            ON DELETE CASCADE;
            
            RAISE NOTICE '✅ Updated public.users.id → auth.users.id with CASCADE';
        END;
    ELSE
        -- No foreign key exists, add it
        ALTER TABLE public.users 
        ADD CONSTRAINT public_users_id_fkey 
        FOREIGN KEY (id) 
        REFERENCES auth.users(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added public.users.id → auth.users.id with CASCADE';
    END IF;
END $$;

-- Step 3: Fix ALL tables that reference public.users
-- We'll do this dynamically to catch any constraint names

DO $$
DECLARE
    constraint_record RECORD;
    sql_drop TEXT;
    sql_add TEXT;
BEGIN
    FOR constraint_record IN
        SELECT 
            tc.table_schema,
            tc.table_name,
            tc.constraint_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE 
            tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_schema = 'public'
            AND ccu.table_name = 'users'
            AND tc.table_schema = 'public'
            AND tc.table_name != 'users'  -- Don't modify the users table itself
        ORDER BY tc.table_name
    LOOP
        -- Drop existing constraint
        sql_drop := format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I',
            constraint_record.table_name,
            constraint_record.constraint_name
        );
        
        EXECUTE sql_drop;
        
        -- Recreate with CASCADE DELETE
        sql_add := format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.users(id) ON DELETE CASCADE',
            constraint_record.table_name,
            constraint_record.constraint_name || '_cascade',
            constraint_record.column_name
        );
        
        EXECUTE sql_add;
        
        RAISE NOTICE '✅ Updated %.%.% → public.users.id with CASCADE',
            constraint_record.table_name,
            constraint_record.column_name,
            constraint_record.constraint_name;
    END LOOP;
END $$;

-- Step 4: Also check for profiles table if it references auth.users directly
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Get constraint name
        DECLARE
            prof_constraint TEXT;
        BEGIN
            SELECT constraint_name INTO prof_constraint
            FROM information_schema.table_constraints
            WHERE table_schema = 'public'
            AND table_name = 'profiles'
            AND constraint_type = 'FOREIGN KEY'
            LIMIT 1;
            
            -- Drop and recreate
            EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS %I', prof_constraint);
            
            -- Check if it references auth.users or public.users
            IF EXISTS (
                SELECT 1 FROM information_schema.constraint_column_usage ccu
                JOIN information_schema.table_constraints tc
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.table_name = 'profiles'
                AND ccu.table_schema = 'auth'
                AND ccu.table_name = 'users'
            ) THEN
                ALTER TABLE public.profiles 
                ADD CONSTRAINT profiles_id_fkey_cascade
                FOREIGN KEY (id) 
                REFERENCES auth.users(id) 
                ON DELETE CASCADE;
            ELSE
                ALTER TABLE public.profiles 
                ADD CONSTRAINT profiles_id_fkey_cascade
                FOREIGN KEY (id) 
                REFERENCES public.users(id) 
                ON DELETE CASCADE;
            END IF;
            
            RAISE NOTICE '✅ Updated profiles foreign key with CASCADE';
        END;
    END IF;
END $$;

-- Step 5: Final verification - show all constraints and their delete rules
SELECT
    'FINAL STATUS' AS status,
    tc.table_name,
    kcu.column_name,
    tc.constraint_name,
    ccu.table_schema || '.' || ccu.table_name AS references_table,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ WILL AUTO-DELETE'
        ELSE '❌ WILL BLOCK DELETION: ' || rc.delete_rule
    END AS deletion_behavior
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

