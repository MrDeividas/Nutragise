# Habit Notification Names - Implementation Summary

## Overview

Updated habit invite notifications to display the specific habit name instead of generic text. Now shows "invited you to track Sleep together" instead of "invited you to track a habit together".

## What Was Changed

### 1. Added Core Habit Name Mapping in `lib/habitInviteService.ts`

Created a constant mapping of core habit keys to display names:

```typescript
const CORE_HABIT_NAMES: Record<string, string> = {
  gym: 'Gym',
  run: 'Run',
  sleep: 'Sleep',
  water: 'Water',
  reflect: 'Reflect',
  focus: 'Focus',
  update_goal: 'Update Goal',
  meditation: 'Meditation',
  microlearn: 'Microlearn',
  cold_shower: 'Cold Shower',
  screen_time: 'Screen Time Limit',
  like: 'Like Posts',
  comment: 'Comment Posts',
  share: 'Share Posts',
};
```

### 2. Added Helper Method `getHabitDisplayName()`

New private method in `HabitInviteService`:
- For **core habits**: Returns the friendly name from the mapping (e.g., "Sleep", "Gym")
- For **custom habits**: Fetches the habit from the database and returns its title
- Falls back to generic names if not found

### 3. Updated Notification Creation in `sendHabitInvite()`

Modified both notification creation calls (re-send and new invite):
- Now fetches the habit display name before creating the notification
- Stores the habit name in the `habit_type` field of the notification
- This happens for both initial invites and re-sent invites

### 4. Updated Notification Display in `screens/NotificationsScreen.tsx`

Modified the notification message generation:

**For habit invites:**
```typescript
message = notification.habit_type 
  ? `invited you to track ${notification.habit_type} together`
  : 'invited you to track a habit together';
```

**For accepted invites:**
```typescript
message = notification.habit_type
  ? `accepted your ${notification.habit_type} habit invitation`
  : 'accepted your habit invitation';
```

Both cases include fallbacks to the generic message if habit_type is not available (for backwards compatibility with existing notifications).

## Examples

### Before:
- "John invited you to track a habit together"
- "Jane accepted your habit invitation"

### After:
- "John invited you to track **Sleep** together"
- "Jane invited you to track **Be Happy** together" (custom habit)
- "Jane accepted your **Gym** habit invitation"
- "John accepted your **Meditation Challenge** habit invitation" (custom habit)

## Technical Details

### Data Flow

1. User sends habit invite
2. `sendHabitInvite()` is called with habit type and identifier
3. `getHabitDisplayName()` fetches the display name:
   - Core: Looks up in `CORE_HABIT_NAMES` constant
   - Custom: Queries database for habit title
4. Notification is created with `habit_type` = display name
5. When displayed, NotificationsScreen reads `habit_type` and includes it in the message

### Backwards Compatibility

- Existing notifications without `habit_type` will still display the generic message
- Fallback logic ensures no errors for old notifications
- New notifications will always have the habit name included

## Files Modified

1. **`lib/habitInviteService.ts`**
   - Added `CORE_HABIT_NAMES` constant
   - Added `getHabitDisplayName()` method
   - Updated notification creation in `sendHabitInvite()` (2 locations)

2. **`screens/NotificationsScreen.tsx`**
   - Updated message generation for `habit_invite` type
   - Updated message generation for `habit_invite_accepted` type
   - Added fallback logic for backwards compatibility

## Testing

To verify the changes work:

1. **Core Habit Invite:**
   - Send an invite for a core habit (e.g., Sleep, Gym)
   - Check notification says "invited you to track Sleep together"

2. **Custom Habit Invite:**
   - Send an invite for a custom habit
   - Check notification shows the custom habit's title

3. **Accept Invite:**
   - Accept a habit invite
   - Check the inviter's notification says "accepted your [Habit Name] habit invitation"

4. **Backwards Compatibility:**
   - Old notifications should still display without errors
   - They will show the generic message

## No Database Changes Required

Uses existing `notifications.habit_type` column that was already in the schema but underutilized. No migrations needed.

