# Habit Pending Invites Feature

## Overview
When you send a habit accountability invite to a friend, you can now see the pending invite status directly on the habit card with the invitee's profile photo, a "Pending..." status, and the ability to cancel the invite.

## Features

### 1. **Visual Pending Status**
- **Invitee's Profile Photo**: Shows the avatar of the person you invited (slightly dimmed to indicate pending status)
- **"Pending..." Text**: Italic, semi-transparent text to indicate waiting for acceptance
- **Cancel Button**: Red "Cancel" button to revoke the invite

### 2. **Cancel Invite**
- Click the "Cancel" button to revoke a pending invite
- Confirmation dialog asks: "Cancel invite to [Username] for [Habit]?"
- Successfully cancelled invites are immediately removed from the UI

### 3. **Smart Display Logic**
The habit card shows different states based on partnership status:
- **No Partnership & No Pending Invite**: Shows "Invite friend" button
- **Pending Invite**: Shows invitee's photo, "Pending..." text, and "Cancel" button
- **Active Partnership**: Shows partner's photo, completion status, and nudge functionality

## Implementation Details

### Database
- Uses existing `habit_accountability_partners` table
- Filters for `status = 'pending'` and `inviter_id = current_user`
- When cancelled, updates `status` to `'cancelled'`

### New Methods

#### `habitInviteService.ts`
```typescript
// Get all pending invites sent by a user
async getPendingInvites(userId: string): Promise<HabitAccountabilityPartner[]>

// Cancel a pending invite (inviter only)
async cancelInvite(partnershipId: string, userId: string): Promise<boolean>
```

### UI Components Updated

#### `InviteFriendModal.tsx`
- Added `onInviteSuccess` callback prop
- Triggers callback after successfully sending invite
- Enables automatic UI refresh

#### `AnimatedHabitCard.tsx` (Core Habits)
- Added `pendingInvite` prop
- Added `onCancelInvite` callback
- Shows pending invite UI when `pendingInvite` exists

#### `WhiteHabitCard.tsx` (Custom Habits)
- Added `pendingInvite` prop
- Added `onCancelInvite` callback
- Shows pending invite UI when `pendingInvite` exists

#### `ActionScreen.tsx`
- Added `pendingInvites` state
- Added `loadPendingInvites()` function
- Added `handleCancelInvite()` callback
- Passes `loadPendingInvites` to modal as `onInviteSuccess`
- Passes pending invite data to all habit cards

## User Flow

### Sending an Invite
1. User clicks "Invite friend" on a habit card
2. Selects a friend from the modal
3. Invite is sent with `status = 'pending'`
4. **System automatically:**
   - Reloads pending invites (via `onInviteSuccess` callback)
   - Shows success alert
   - Closes modal
5. **Habit card immediately updates to show:**
   - Friend's profile photo (dimmed)
   - "Pending..." text
   - "Cancel" button

### Cancelling an Invite
1. User clicks "Cancel" button on the pending invite
2. Confirmation dialog appears
3. If confirmed:
   - Partnership status updated to `'cancelled'`
   - UI refreshes to show "Invite friend" again

### When Invite is Accepted
1. Invitee accepts the invite in their notifications
2. Partnership status changes to `'accepted'`
3. Inviter's habit card updates to show:
   - Partner's photo (full opacity)
   - Completion status
   - Nudge functionality

## Styling

### Animated Habit Card (Core Habits)
- **Pending Photo**: 20x20px, rounded, white border, 60% opacity
- **Pending Text**: White, 11px, italic, 50% opacity
- **Cancel Button**: Red background (rgba(248, 113, 113, 0.2)), red text, 8px padding

### White Habit Card (Custom Habits)
- **Pending Photo**: 20x20px, rounded, theme border, 60% opacity
- **Pending Text**: Theme subtitle color, 11px, italic, 70% opacity
- **Cancel Button**: Red background (rgba(248, 113, 113, 0.15)), red text, 8px padding

## Testing

### Test Scenarios
1. **Send Invite**
   - Send a habit invite to a friend
   - ✅ Verify pending status appears immediately
   - ✅ Verify friend's photo is shown

2. **Cancel Invite**
   - Click "Cancel" on a pending invite
   - ✅ Verify confirmation dialog appears
   - ✅ Verify invite is cancelled and UI updates

3. **Invite Accepted**
   - Have friend accept the invite
   - ✅ Verify inviter's card updates to show active partnership
   - ✅ Verify nudge functionality works

4. **Multiple Pending Invites**
   - Send invites for multiple habits
   - ✅ Verify each habit shows correct pending status
   - ✅ Verify cancelling one doesn't affect others

## Edge Cases Handled

1. **Deleted User**: If invitee's profile is deleted, shows "Unknown User"
2. **Missing Avatar**: Falls back to placeholder image
3. **Concurrent Acceptance**: If invitee accepts while inviter is viewing, next refresh shows active partnership
4. **Network Errors**: Shows error alert if cancel fails

## Future Enhancements

1. **Push Notification**: Notify inviter when invite is accepted
2. **Expire Invites**: Auto-cancel invites after X days
3. **Batch Cancel**: Cancel all pending invites for a habit
4. **Resend Invite**: Option to resend a cancelled invite

## Related Files

- `lib/habitInviteService.ts` - Service methods
- `screens/ActionScreen.tsx` - Main screen logic
- `components/AnimatedHabitCard.tsx` - Core habit cards
- `components/WhiteHabitCard.tsx` - Custom habit cards
- `types/database.ts` - TypeScript interfaces

## Notes

- Pending invites are loaded on screen focus alongside active partnerships
- Cancel action requires confirmation to prevent accidental cancellations
- Only the inviter can cancel a pending invite (not the invitee)
- Cancelled invites remain in the database for audit purposes but are filtered out of queries

