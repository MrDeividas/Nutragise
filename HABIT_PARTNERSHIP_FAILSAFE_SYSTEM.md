# Habit Partnership Fail-Safe System

## Overview

A comprehensive fail-safe system has been implemented to prevent broken partnerships and ensure smooth habit tracking for accountability partners.

---

## Features Implemented

### ✅ 1. **Auto-Cleanup Partnerships on Habit Deletion**

**What it does:**
- When a user deletes a custom habit, the system automatically:
  - Finds all active partnerships for that habit
  - Cancels the partnerships (sets status to `'cancelled'`)
  - Notifies all partners that the habit was deleted

**Files changed:**
- `lib/habitsService.ts` - `deleteHabit()` method

**How it works:**
```typescript
// Before deleting the habit:
1. Query habit_accountability_partners for habit ID
2. For each active partnership:
   - Update status to 'cancelled'
   - Send notification to partner
3. Then delete the habit
```

**User Experience:**
- Partner receives notification: "[User] deleted a habit you were tracking together. Partnership cancelled."
- Partner's habit remains (they can keep tracking it alone or delete it)

---

### ✅ 2. **Warning Before Deleting Habits with Partnerships**

**What it does:**
- Before allowing deletion, checks if the habit has active partnerships
- Shows enhanced warning with partner names
- Clear action button: "Cancel Partnerships & Delete"

**Files changed:**
- `state/actionStore.ts` - Added `checkHabitPartnerships()` method
- `screens/ActionScreen.tsx` - Updated `handleDeleteHabit()` callback

**User Experience:**

**Without partnerships:**
```
Delete Task
Are you sure you want to delete this task?
This action cannot be undone.

[Cancel] [Delete]
```

**With partnerships:**
```
Delete Task
This habit has active partnerships with: John Doe, Jane Smith.

Deleting this habit will cancel all partnerships 
and notify your partners.

Are you sure you want to continue?

[Cancel] [Cancel Partnerships & Delete]
```

After deletion:
```
Deleted
Habit deleted and 2 partnership(s) cancelled.
```

---

### ✅ 3. **Auto-Recreation of Missing Habits from Snapshot**

**What it does:**
- When loading partnerships, if a referenced habit doesn't exist:
  - Checks if `habit_snapshot` exists
  - Automatically recreates the habit from the snapshot
  - Updates the partnership with the new habit ID
  - Reloads custom habits to display the recreated habit

**Files changed:**
- `screens/ActionScreen.tsx` - Enhanced `loadActivePartnerships()` method

**How it works:**
```typescript
1. Load partnership → habit ID = "abc-123"
2. Check if habit "abc-123" exists in customHabits
3. If NOT found:
   a. Check if habit_snapshot exists
   b. Create new habit from snapshot → new ID = "xyz-789"
   c. Update partnership: inviter_habit_id/invitee_habit_id = "xyz-789"
   d. Reload custom habits
4. Partnership now works with the recreated habit
```

**User Experience:**
- Seamless - user never knows the habit was missing
- Habit automatically reappears with all original settings
- Partnership continues working normally

**Console logs:**
```
[Partnership] Habit abc-123 missing, recreating from snapshot...
[Partnership] Recreated habit from snapshot: Be Happy (xyz-789)
```

---

## Architecture

### **Habit Deletion Flow:**

```
User clicks "Delete" on habit
         ↓
Check for active partnerships
         ↓
   ┌─────┴─────┐
   │           │
Partnerships  No partnerships
   │           │
   ↓           ↓
Show warning  Show normal
with partners confirmation
   │           │
   ↓           ↓
User confirms User confirms
   │           │
   ↓           ↓
Cancel all    Delete habit
partnerships  directly
   │
   ↓
Notify partners
   │
   ↓
Delete habit
   │
   ↓
Show success
with count
```

### **Partnership Loading Flow:**

```
Load partnerships from DB
         ↓
For each custom habit partnership:
         ↓
Get habit ID (inviter or invitee)
         ↓
Check if habit exists in customHabits
         ↓
   ┌─────┴─────┐
   │           │
 Exists    Missing
   │           │
   ↓           ↓
Use habit  Check snapshot
normally        │
               ↓
          ┌────┴────┐
          │         │
     Snapshot    No snapshot
      exists        │
          │         ↓
          ↓      Skip partnership
    Recreate
     habit
          │
          ↓
     Update
   partnership
          │
          ↓
     Reload
   custom habits
          │
          ↓
   Partnership works
```

---

## Benefits

### **For Users:**
✅ No more broken partnerships  
✅ Clear warnings before destructive actions  
✅ Automatic recovery from missing habits  
✅ Partners are always notified  

### **For Developers:**
✅ Robust error handling  
✅ Automatic cleanup reduces manual fixes  
✅ Detailed logging for debugging  
✅ Backwards compatible with existing data  

---

## Testing

### Test Case 1: Delete Habit with Partnership
1. Create custom habit "Test Habit"
2. Send invite to partner
3. Partner accepts
4. Delete "Test Habit"
5. **Expected**: Warning shows with partner name
6. Confirm deletion
7. **Expected**: Habit deleted, partnership cancelled, partner notified

### Test Case 2: Delete Habit without Partnership
1. Create custom habit "Solo Habit"
2. Don't send any invites
3. Delete "Solo Habit"
4. **Expected**: Normal confirmation, no partner warnings

### Test Case 3: Auto-Recreation from Snapshot
1. User A creates habit, invites User B
2. User B accepts (habit created for them)
3. User A deletes their habit
4. User B opens app
5. **Expected**: User B's habit still shows with partnership (nothing breaks)
6. User A reopens app
7. **Expected**: User A's habit is auto-recreated from snapshot, partnership works again

### Test Case 4: Missing Snapshot
1. Partnership exists with habit ID that doesn't exist
2. No snapshot available
3. **Expected**: Partnership is skipped, logged, doesn't crash

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| Habit deleted, partnership exists | Partnership auto-cancelled, partners notified |
| Habit missing, snapshot exists | Habit auto-recreated from snapshot |
| Habit missing, no snapshot | Partnership skipped, logged |
| Multiple partnerships for one habit | All partnerships cancelled on deletion |
| Notification fails | Deletion continues (logged but not blocked) |
| Recreation fails | Partnership skipped (logged but doesn't crash) |

---

## Future Enhancements (Optional)

### Not Yet Implemented:

1. **Archive instead of Delete** - Offer to archive habits with partnerships
2. **Transfer Partnership** - Allow transferring partnership to a different habit
3. **Orphaned Partnership Cleanup** - Cron job to clean up old cancelled partnerships
4. **Partnership Restore** - Allow reactivating cancelled partnerships
5. **Bulk Partnership Management** - UI to view/manage all partnerships

---

## Database Changes

No schema changes required! The system uses existing columns:
- `habit_accountability_partners.status` (for cancellation)
- `habit_accountability_partners.habit_snapshot` (for recreation)
- `habit_accountability_partners.inviter_habit_id` / `invitee_habit_id` (for tracking)

---

## API Methods Added

### `habitsService.getActivePartnerships(userId, habitId)`
**Purpose**: Check if a habit has active partnerships  
**Returns**: Array of partnership objects with partner details  
**Used by**: `checkHabitPartnerships()` in ActionStore

### `actionStore.checkHabitPartnerships(habitId)`
**Purpose**: Wrapper to check partnerships from UI  
**Returns**: Promise<any[]>  
**Used by**: `handleDeleteHabit()` in ActionScreen

---

## Logging

All operations log to console for debugging:

```
[DeleteHabit] Cancelling 2 partnerships for habit abc-123
[DeleteHabit] Error sending notification: ...
[Partnership] Habit abc-123 missing, recreating from snapshot...
[Partnership] Recreated habit from snapshot: Be Happy (xyz-789)
[Partnership] Error recreating habit from snapshot: ...
[Partnership] Skipping partnership xyz - no habit ID found
```

---

## Summary

The fail-safe system ensures:
1. **Prevention** - Warn users before breaking partnerships
2. **Cleanup** - Automatically cancel partnerships when habits are deleted
3. **Recovery** - Auto-recreate missing habits from snapshots
4. **Communication** - Notify partners of any changes
5. **Robustness** - Graceful failure handling, never crashes

**Result**: A rock-solid partnership system that "just works" for users! 🎉

