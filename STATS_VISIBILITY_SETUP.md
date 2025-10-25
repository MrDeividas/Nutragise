# Stats Visibility Feature Setup

## Issue Fixed
The app was crashing when viewing user profiles because the `stats_visible` column doesn't exist in the database yet.

## What Was Done

### 1. Added Error Handling
- Both `ProfileScreen` and `UserProfileScreen` now gracefully handle missing `stats_visible` column
- Default behavior: Stats are visible (true) if column doesn't exist
- No more crashes when viewing profiles

### 2. Created Database Migration
- File: `supabase/add_stats_visible_column.sql`
- Adds `stats_visible` boolean column to `profiles` table
- Defaults to `true` (stats visible by default)

## How to Complete Setup

### Option 1: Run SQL in Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/add_stats_visible_column.sql`
4. Paste and run the SQL
5. Restart your app

### Option 2: Run SQL via Terminal
```bash
# Navigate to your project
cd /Users/mac/Documents/nutrapp

# Run the migration using Supabase CLI
supabase db push
```

## SQL Migration Content
```sql
-- Add stats_visible column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stats_visible BOOLEAN DEFAULT true;

-- Add comment
COMMENT ON COLUMN profiles.stats_visible IS 'Controls visibility of progression stats on public profile (default: true)';

-- Update existing rows
UPDATE profiles 
SET stats_visible = true 
WHERE stats_visible IS NULL;
```

## Testing

### Before Migration:
- ✅ App won't crash when viewing profiles
- ✅ Stats are visible by default
- ⚠️ Toggle changes save to AsyncStorage only (local)
- ⚠️ You'll see a warning alert when toggling

### After Migration:
- ✅ App won't crash
- ✅ Toggle changes save to database
- ✅ Stats visibility syncs across devices
- ✅ No warning alerts
- ✅ Changes persist when viewing other profiles

## How the Feature Works

### On Your Profile (ProfileScreen)
- Eye icon next to "Progression" title
- Tap to toggle visibility
- `eye-outline` = visible
- `eye-off-outline` = hidden

### On Public Profiles (UserProfileScreen)
- Respects each user's `stats_visible` setting
- Hides all progress bars when `stats_visible = false`
- Still shows: avatar, bio, goals, journey, social counts

## Current State
✅ **App is safe to use** - won't crash
⚠️ **Run migration** - to enable full functionality

