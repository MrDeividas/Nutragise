-- Comprehensive Verification: Check if fix worked and find remaining blockers

-- 1. VERIFY: Does public.users → auth.users exist with CASCADE?
SELECT 
    'CRITICAL CHECK: public.users → auth.users' AS check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.referential_constraints rc
                ON tc.constraint_name = rc.constraint_name
            WHERE tc.table_schema = 'public'
            AND tc.table_name = 'users'
            AND tc.constraint_type = 'FOREIGN KEY'
            AND rc.delete_rule = 'CASCADE'
        ) THEN '✅ EXISTS WITH CASCADE'
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.referential_constraints rc
                ON tc.constraint_name = rc.constraint_name
            WHERE tc.table_schema = 'public'
            AND tc.table_name = 'users'
            AND tc.constraint_type = 'FOREIGN KEY'
        ) THEN '⚠️ EXISTS BUT NO CASCADE'
        ELSE '❌ DOES NOT EXIST - This is the problem!'
    END AS status;

-- 2. Show EXACT constraint details for public.users
SELECT 
    'public.users constraint details:' AS info,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_schema || '.' || ccu.table_name AS references_table,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ GOOD'
        ELSE '❌ PROBLEM: ' || rc.delete_rule
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
    tc.table_schema = 'public'
    AND tc.table_name = 'users'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 3. Find ALL tables that reference auth.users DIRECTLY (these also need CASCADE)
SELECT 
    'Tables referencing auth.users directly:' AS info,
    tc.table_schema || '.' || tc.table_name AS table_name,
    kcu.column_name,
    tc.constraint_name,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ OK'
        ELSE '❌ NEEDS CASCADE'
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
    AND ccu.table_schema = 'auth'
    AND ccu.table_name = 'users'
ORDER BY tc.table_name;

-- 4. Check for triggers that might block deletion
SELECT 
    'Triggers on auth.users:' AS info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users'
ORDER BY trigger_name;

-- 5. Check RLS policies
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

-- 6. Check if profiles table references auth.users (common culprit)
SELECT 
    'profiles table constraints:' AS info,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_schema || '.' || ccu.table_name AS references_table,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
    ON rc.constraint_name = tc.constraint_name
WHERE 
    tc.table_schema = 'public'
    AND tc.table_name = 'profiles'
    AND tc.constraint_type = 'FOREIGN KEY';

-- 7. Check ALL tables that might have user references we haven't found
SELECT DISTINCT
    'All tables with user_id columns (might have hidden FKs):' AS info,
    table_schema,
    table_name,
    column_name
FROM information_schema.columns
WHERE column_name IN ('user_id', 'id', 'follower_id', 'following_id', 'sender_id', 'recipient_id', 'host_id')
AND table_schema = 'public'
ORDER BY table_name, column_name;

