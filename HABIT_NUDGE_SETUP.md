# Habit Nudge Feature - Setup Guide

## Overview

The habit nudge feature allows users to send a friendly reminder to their accountability partners when they haven't completed their habits for the day. Users can only nudge once every 3 hours to prevent spam.

## What Was Implemented

### 1. Database Schema
- **New Table**: `habit_nudges` - tracks when users nudge their partners
  - Includes 3-hour cooldown tracking
  - Stores nudge metadata (partnership, habit info, timestamps)
  - Row Level Security (RLS) policies for privacy

### 2. Backend Services
- **notificationService**: Added `createHabitNudgeNotification()` method
- **habitInviteService**: Added two new methods:
  - `canSendNudge()` - checks if 3-hour cooldown has passed
  - `sendNudge()` - records nudge and sends notification

### 3. UI Components
- **AnimatedHabitCard**: Shows "Nudge" button instead of "Not completed" text
- **WhiteHabitCard**: Shows "Nudge" button instead of "Not completed" text
- **ActionScreen**: Implements `handleNudge()` callback to process nudges

### 4. User Experience
- When a partner hasn't completed their habit, a "Nudge" button appears
- Clicking the button sends a notification to the partner
- Success/error messages inform the user
- 3-hour cooldown prevents spam

## Setup Instructions

### Step 1: Run Database Migration

Run the migration to create the `habit_nudges` table:

```bash
# Navigate to your project directory
cd "/Users/mac/Documents/nutrapp Test design"

# Run the migration in Supabase Dashboard
# Go to SQL Editor and run the contents of:
# supabase/migrations/create_habit_nudges_table.sql
```

**Or via Supabase CLI** (if you have it set up):

```bash
supabase db push
```

### Step 2: Verify the Setup

1. Check that the `habit_nudges` table exists in your Supabase database
2. Verify RLS policies are enabled
3. Test the feature in your app:
   - Find a habit with an accountability partner
   - Wait for partner to not complete their habit
   - Click the "Nudge" button
   - Verify notification is sent
   - Try clicking again to verify 3-hour cooldown works

### Step 3: Update Notification Handling (Optional)

If you want to customize the notification message or add push notifications:

1. Update `createHabitNudgeNotification()` in `lib/notificationService.ts`
2. Add a handler in your notifications screen to display nudge notifications

## Database Schema

```sql
CREATE TABLE habit_nudges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  partnership_id UUID NOT NULL REFERENCES habit_accountability_partners(id) ON DELETE CASCADE,
  nudger_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  nudged_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  habit_type TEXT NOT NULL CHECK (habit_type IN ('core', 'custom')),
  habit_key TEXT, -- For core habits
  custom_habit_id UUID, -- For custom habits
  nudged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Files Modified

1. `supabase/migrations/create_habit_nudges_table.sql` - New migration file
2. `lib/notificationService.ts` - Added nudge notification method
3. `lib/habitInviteService.ts` - Added nudge logic with cooldown
4. `components/AnimatedHabitCard.tsx` - Added nudge button UI
5. `components/WhiteHabitCard.tsx` - Added nudge button UI
6. `screens/ActionScreen.tsx` - Added nudge handler
7. `types/database.ts` - Added HabitNudge interface

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] Nudge button appears when partner hasn't completed habit
- [ ] Clicking nudge sends notification to partner
- [ ] Success alert appears after nudging
- [ ] Trying to nudge again within 3 hours shows cooldown message
- [ ] After 3 hours, nudge button works again
- [ ] Nudge notifications appear in partner's notification list
- [ ] RLS policies prevent unauthorized access to nudge data

## Troubleshooting

### "Failed to send nudge" error
- Check that the `habit_nudges` table exists
- Verify RLS policies are enabled
- Ensure user is authenticated

### Nudge button doesn't appear
- Verify partner hasn't completed habit for today
- Check that partnership status is 'accepted'
- Ensure `activePartnerships` and `partnerCompletionStatus` are loaded

### Cooldown not working
- Check database query in `canSendNudge()`
- Verify timestamps are being stored correctly
- Ensure timezone is set to UTC in database

## Future Enhancements

Possible improvements:
- Push notifications for nudges
- Customize nudge message
- Track nudge statistics
- Add "nudge back" feature
- Show nudge history in UI

