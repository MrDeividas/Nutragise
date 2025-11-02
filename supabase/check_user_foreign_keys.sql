-- Check all foreign key constraints that reference auth.users or public.users
-- Run this first to see which tables are blocking user deletion

SELECT
    tc.table_schema,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ Will auto-delete'
        WHEN rc.delete_rule = 'SET NULL' THEN '⚠️ Will set to NULL'
        WHEN rc.delete_rule = 'RESTRICT' THEN '❌ BLOCKS deletion'
        WHEN rc.delete_rule = 'NO ACTION' THEN '❌ BLOCKS deletion'
        ELSE '❓ Unknown: ' || rc.delete_rule
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
        ccu.table_name = 'users' 
        OR ccu.table_name = 'auth.users'
    )
ORDER BY tc.table_name, kcu.column_name;

-- Also check if tables reference public.users instead of auth.users
SELECT
    'Tables referencing public.users:' AS info,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS references_table
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.constraint_type = 'FOREIGN KEY' 
    AND ccu.table_schema = 'public'
    AND ccu.table_name = 'users'
ORDER BY tc.table_name;

