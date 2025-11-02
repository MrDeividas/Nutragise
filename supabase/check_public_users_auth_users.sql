-- Check if public.users has a foreign key to auth.users
-- This is CRITICAL for user deletion to work

-- Check 1: Does public.users.id have ANY foreign key?
SELECT 
    'public.users foreign keys:' AS check_type,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_schema || '.' || ccu.table_name AS references_table,
    rc.delete_rule
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

-- Check 2: Does public.users reference auth.users specifically?
SELECT 
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
            AND kcu.column_name = 'id'
            AND ccu.table_schema = 'auth'
            AND ccu.table_name = 'users'
        ) THEN '✅ public.users.id HAS foreign key to auth.users'
        ELSE '❌ MISSING: public.users.id does NOT reference auth.users - THIS IS THE PROBLEM!'
    END AS status;

-- Check 3: If it exists, what's the delete rule?
SELECT 
    'public.users → auth.users delete rule:' AS info,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ GOOD - Will auto-delete'
        ELSE '❌ PROBLEM - Delete rule is: ' || rc.delete_rule || ' (needs to be CASCADE)'
    END AS status
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
    ON rc.constraint_name = tc.constraint_name
WHERE 
    tc.table_schema = 'public'
    AND tc.table_name = 'users'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'id'
    AND ccu.table_schema = 'auth'
    AND ccu.table_name = 'users';

