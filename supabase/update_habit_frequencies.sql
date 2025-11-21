-- Update habit frequencies to match requirements
-- This script ensures:
-- 1. Sleep and water are 7 days/week for all users (fixed frequency)
-- 2. Reflect is 7 days/week for deividasg user specifically

-- First, ensure the columns exist (they should from onboarding, but just in case)
DO $$ 
BEGIN
    -- Add habit_schedules column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'habit_schedules'
    ) THEN
        ALTER TABLE profiles ADD COLUMN habit_schedules JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Add selected_habits column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'selected_habits'
    ) THEN
        ALTER TABLE profiles ADD COLUMN selected_habits TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;

    -- Add habits_last_changed column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'habits_last_changed'
    ) THEN
        ALTER TABLE profiles ADD COLUMN habits_last_changed TIMESTAMPTZ;
    END IF;
END $$;

-- Update all users: set sleep and water to 7 days per week
UPDATE profiles
SET habit_schedules = jsonb_set(
    jsonb_set(
        COALESCE(habit_schedules, '{}'::jsonb),
        '{sleep}',
        '[true, true, true, true, true, true, true]'::jsonb
    ),
    '{water}',
    '[true, true, true, true, true, true, true]'::jsonb
)
WHERE id IS NOT NULL;

-- Update deividasg user: set reflect to 7 days per week
UPDATE profiles
SET habit_schedules = jsonb_set(
    COALESCE(habit_schedules, '{}'::jsonb),
    '{reflect}',
    '[true, true, true, true, true, true, true]'::jsonb
)
WHERE username = 'deividasg';

-- Unlock habit editing for deividasg user (remove 6-week lock)
UPDATE profiles
SET habits_last_changed = NULL
WHERE username = 'deividasg';

-- Display updated schedules
SELECT 
    username,
    habit_schedules,
    habits_last_changed,
    CASE 
        WHEN habits_last_changed IS NULL THEN 'Unlocked (can edit)'
        WHEN (NOW() - habits_last_changed) > INTERVAL '6 weeks' THEN 'Unlocked (6 weeks passed)'
        ELSE 'Locked for ' || CEIL(EXTRACT(EPOCH FROM (habits_last_changed + INTERVAL '6 weeks' - NOW())) / 86400) || ' more days'
    END as edit_status
FROM profiles
WHERE username = 'deividasg' OR habit_schedules IS NOT NULL
ORDER BY username;

