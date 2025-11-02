-- Fix nutragisee account onboarding status
-- Based on the check, onboarding_completed was incorrectly set to true
-- but onboarding_last_step is 5, meaning they exited early

-- First, check current status
SELECT 
    id,
    username,
    onboarding_completed,
    onboarding_last_step,
    'BEFORE FIX' AS status
FROM profiles
WHERE username = 'nutragisee';

-- Fix the status
UPDATE profiles
SET 
    onboarding_completed = false,
    onboarding_last_step = 5  -- Keep the last step they were on
WHERE username = 'nutragisee';

-- Verify the fix
SELECT 
    id,
    username,
    onboarding_completed,
    onboarding_last_step,
    CASE 
        WHEN onboarding_completed = false AND onboarding_last_step >= 2 THEN '🔔 Should show reminder (exited)'
        ELSE '⚠️ Check status'
    END AS status,
    'AFTER FIX' AS fix_status
FROM profiles
WHERE username = 'nutragisee';

