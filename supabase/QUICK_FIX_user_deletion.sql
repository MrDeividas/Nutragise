-- QUICK FIX: Add Missing Link for User Deletion
-- This adds the critical foreign key: public.users → auth.users with CASCADE DELETE

-- Step 1: Remove any existing constraint (if exists, might not have CASCADE)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS public_users_id_fkey;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS public_users_auth_users_fkey;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS public_users_auth_users_cascade;

-- Step 2: Add the critical foreign key with CASCADE DELETE
ALTER TABLE public.users 
ADD CONSTRAINT public_users_auth_users_cascade
FOREIGN KEY (id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Step 3: Verify it worked
SELECT 
    '✅ VERIFICATION:' AS status,
    tc.constraint_name,
    rc.delete_rule,
    CASE 
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ SUCCESS - User deletion will work!'
        ELSE '❌ FAILED - Delete rule is: ' || rc.delete_rule
    END AS result
FROM information_schema.table_constraints tc
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE 
    tc.table_schema = 'public'
    AND tc.table_name = 'users'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND tc.constraint_name = 'public_users_auth_users_cascade';

