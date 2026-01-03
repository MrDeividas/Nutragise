# Pending Invites Not Updating - Debug & Fix

## Issue
After sending a habit invite, the white custom habit card doesn't update immediately to show the pending status. The "Invite friend" button remains visible instead of changing to show the invitee's photo and "Pending..." status.

## Root Causes Identified

### 1. **Async Race Condition**
- `onInviteSuccess()` callback was called but not awaited
- Modal closed before pending invites finished loading
- React didn't have time to re-render with new state

### 2. **Timing Issue**
- Alert was shown before state updated
- Modal closure happened before data refresh completed

## Fixes Applied

### Fix 1: Await the Callback
**File**: `components/InviteFriendModal.tsx`

**Before:**
```typescript
// Trigger success callback to refresh pending invites
if (onInviteSuccess) {
  onInviteSuccess(); // Not awaited!
}

Alert.alert(
  'Invite Sent!',
  `Invitation to join ${habitTitle} has been sent.`,
  [{ text: 'OK', onPress: onClose }]
);
```

**After:**
```typescript
// Trigger success callback to refresh pending invites and WAIT for it to complete
if (onInviteSuccess) {
  await onInviteSuccess(); // ✅ Awaited!
}

// Close modal immediately
onClose();

// Show success alert after modal is closed
Alert.alert(
  'Invite Sent!',
  `Invitation to join ${habitTitle} has been sent.`
);
```

**Changes:**
1. ✅ Added `await` to ensure `loadPendingInvites()` completes
2. ✅ Close modal immediately after data loads (faster UX)
3. ✅ Show alert after modal closes (cleaner UX)

### Fix 2: Comprehensive Logging
**Files**: 
- `lib/habitInviteService.ts`
- `screens/ActionScreen.tsx`

Added detailed logging to trace the data flow:

**In `habitInviteService.getPendingInvites()`:**
```typescript
console.log('[getPendingInvites] Found invites:', invites.map(i => ({
  id: i.id,
  habit_type: i.habit_type,
  habit_key: i.habit_key,
  custom_habit_id: i.custom_habit_id,
  inviter_habit_id: i.inviter_habit_id,
  invitee_id: i.invitee_id
})));
```

**In `ActionScreen.loadPendingInvites()`:**
```typescript
console.log('[loadPendingInvites] Mapped invite:', {
  habit_type: invite.habit_type,
  inviter_habit_id: invite.inviter_habit_id,
  custom_habit_id: invite.custom_habit_id,
  habitId,
  key,
  invitee: invite.partner?.username
});
```

**In `ActionScreen` render (WhiteHabitCard):**
```typescript
console.log(`[WhiteHabitCard Render] ${card.title}:`, {
  habitId: card.habit.id,
  lookupKey,
  hasPending,
  hasPartnership,
  availablePendingKeys: Object.keys(pendingInvites),
  availablePartnershipKeys: Object.keys(activePartnerships)
});
```

## How to Debug

### Step 1: Send an Invite
1. Open a custom habit card
2. Click "Invite friend"
3. Select a user
4. Click "Invite"

### Step 2: Check Console Logs
Look for these logs in order:

**1. Invite Sent:**
```
[getPendingInvites] Found invites: [...]
```

**2. Pending Invites Loaded:**
```
[loadPendingInvites] Mapped invite: { habit_type: 'custom', inviter_habit_id: 'abc-123', ... }
[ActionScreen] Loaded pending invites keys: ['custom_abc-123']
[ActionScreen] Total pending invites: 1
```

**3. Card Render:**
```
[WhiteHabitCard Render] My Custom Habit: {
  habitId: 'abc-123',
  lookupKey: 'custom_abc-123',
  hasPending: true,
  hasPartnership: false,
  availablePendingKeys: ['custom_abc-123'],
  availablePartnershipKeys: []
}
```

### Step 3: Verify Match
- ✅ `lookupKey` should match one of the `availablePendingKeys`
- ✅ `hasPending` should be `true`
- ✅ Card should show pending UI

## Expected Behavior

### Before Fix:
1. Send invite
2. Modal closes
3. **Card still shows "Invite friend"** ❌
4. Navigate away and back → **Now shows pending** (after reload)

### After Fix:
1. Send invite
2. **Pending invites reload** (awaited)
3. Modal closes
4. **Card immediately shows pending status** ✅
5. Success alert appears

## Key Learnings

### Async Callback Pattern
When using callbacks that perform async operations:
```typescript
// ❌ BAD - Callback not awaited
if (onSuccess) {
  onSuccess(); // Fires and forgets
}
doSomethingElse(); // Runs before onSuccess completes

// ✅ GOOD - Callback awaited
if (onSuccess) {
  await onSuccess(); // Waits for completion
}
doSomethingElse(); // Runs after onSuccess completes
```

### State Update Timing
React state updates are asynchronous. To ensure UI reflects new state:
1. Wait for async operations to complete (`await`)
2. Ensure state update functions complete before UI interactions
3. Use logging to verify state changes propagate

### Key Matching Strategy
For partnerships/invites on custom habits:
- **Store**: Use `inviter_habit_id` (habit ID from inviter's perspective)
- **Lookup**: Use `custom_${card.habit.id}` (habit ID from card)
- **Match**: These should be the same ID

## Testing Checklist

- [ ] Send invite for core habit → Shows pending immediately
- [ ] Send invite for custom habit → Shows pending immediately
- [ ] Cancel pending invite → Shows "Invite friend" again
- [ ] Send multiple invites → Each card shows correct status
- [ ] Reload app → Pending invites persist
- [ ] Accept invite (on other account) → Inviter sees active partnership

## Related Files

- `components/InviteFriendModal.tsx` - Invite sending logic
- `lib/habitInviteService.ts` - Database queries
- `screens/ActionScreen.tsx` - State management & rendering
- `components/WhiteHabitCard.tsx` - Custom habit card UI
- `components/AnimatedHabitCard.tsx` - Core habit card UI

## Notes

- Logging can be removed once verified working
- Consider adding error boundaries for async failures
- Monitor performance with many pending invites (>10)

