-- Diagnostic Script: Find EXACTLY what's blocking user deletion
-- Run this FIRST to understand the problem

-- 1. Check if public.users has ANY foreign key to auth.users
SELECT 
    'public.users → auth.users relationship:' AS check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.table_schema = 'public'
            AND tc.table_name = 'users'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_schema = 'auth'
            AND ccu.table_name = 'users'
        ) THEN '✅ EXISTS'
        ELSE '❌ MISSING - This might be the problem!'
    END AS status;

-- 2. Show ALL foreign keys that reference users (either public.users or auth.users)
SELECT 
    'ALL Foreign Keys Referencing Users:' AS info,
    tc.table_schema || '.' || tc.table_name AS table_name,
    kcu.column_name,
    tc.constraint_name,
    ccu.table_schema || '.' || ccu.table_name AS references_table,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ Will auto-delete'
        WHEN rc.delete_rule = 'RESTRICT' THEN '❌ BLOCKS deletion'
        WHEN rc.delete_rule = 'NO ACTION' THEN '❌ BLOCKS deletion'
        WHEN rc.delete_rule = 'SET NULL' THEN '⚠️ Will set to NULL'
        ELSE '❓ Unknown: ' || rc.delete_rule
    END AS impact
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
ORDER BY 
    CASE WHEN rc.delete_rule IN ('RESTRICT', 'NO ACTION') THEN 1 ELSE 2 END,
    tc.table_name;

-- 3. Find any BLOCKING constraints (RESTRICT or NO ACTION)
SELECT 
    '❌ BLOCKING Constraints (must fix these):' AS warning,
    tc.table_schema || '.' || tc.table_name AS blocking_table,
    kcu.column_name,
    tc.constraint_name,
    ccu.table_schema || '.' || ccu.table_name AS references_table,
    rc.delete_rule
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
    AND rc.delete_rule IN ('RESTRICT', 'NO ACTION')
    AND (
        (ccu.table_name = 'users' AND ccu.table_schema = 'public')
        OR (ccu.table_name = 'users' AND ccu.table_schema = 'auth')
    );

-- 4. Check for triggers that might block deletion
SELECT 
    'Triggers on auth.users:' AS info,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';

-- 5. Check RLS policies that might block
SELECT 
    'RLS Policies on auth.users:' AS info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'auth'
AND tablename = 'users';

