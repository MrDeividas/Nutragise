-- Check onboarding status for debugging
-- Replace 'YOUR_USER_ID' with your actual user ID

SELECT 
    id,
    username,
    onboarding_completed,
    onboarding_last_step,
    CASE 
        WHEN onboarding_completed = true THEN '✅ Completed'
        WHEN onboarding_completed = false AND onboarding_last_step IS NULL THEN '⚠️ Not started or no progress saved'
        WHEN onboarding_completed = false AND onboarding_last_step = 1 THEN '⚠️ Still on step 1 (cannot exit yet)'
        WHEN onboarding_completed = false AND onboarding_last_step >= 2 THEN '🔔 Should show reminder (exited)'
        ELSE '❓ Unknown status'
    END AS status
FROM profiles
ORDER BY created_at DESC
LIMIT 10;

-- For a specific user, replace the user ID below
-- SELECT 
--     id,
--     username,
--     onboarding_completed,
--     onboarding_last_step
-- FROM profiles
-- WHERE id = 'YOUR_USER_ID';

