# Habit Partnership Fix - Separate Habit IDs for Inviter and Invitee

## Problem

When a user accepted a custom habit invite, the partnership would only work for ONE user, not both:

### What Was Happening:
1. **Inviter** creates custom habit "Be Happy" with ID `abc-123`
2. **Partnership created** with `custom_habit_id: abc-123`
3. **Invitee accepts** → New habit "Be Happy" created with ID `xyz-789`
4. **Partnership updated** to `custom_habit_id: xyz-789`
5. **Result**: 
   - ✅ Invitee sees partnership (their habit ID matches)
   - ❌ Inviter doesn't see partnership (their habit ID no longer matches)

### The Core Issue:
Each user has their **own copy** of the custom habit with **different IDs**, but the partnership table only had **one** `custom_habit_id` field.

## Solution

Added **two separate habit ID fields** to the partnership table:
- `inviter_habit_id` - The inviter's custom habit ID
- `invitee_habit_id` - The invitee's custom habit ID

Now both users can track their own copy of the habit while being accountability partners!

## Setup Instructions

### 1. Run the Database Migration

In your **Supabase Dashboard** → **SQL Editor**, run:

```sql
-- Add separate habit ID columns for inviter and invitee
ALTER TABLE habit_accountability_partners
ADD COLUMN IF NOT EXISTS inviter_habit_id UUID,
ADD COLUMN IF NOT EXISTS invitee_habit_id UUID;

-- For existing partnerships, copy custom_habit_id to inviter_habit_id
UPDATE habit_accountability_partners
SET inviter_habit_id = custom_habit_id
WHERE habit_type = 'custom' AND inviter_habit_id IS NULL;

-- Add comments
COMMENT ON COLUMN habit_accountability_partners.inviter_habit_id IS 'The inviter''s custom habit ID';
COMMENT ON COLUMN habit_accountability_partners.invitee_habit_id IS 'The invitee''s custom habit ID';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_habit_partners_inviter_habit ON habit_accountability_partners(inviter_habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_partners_invitee_habit ON habit_accountability_partners(invitee_habit_id);
```

Or use the file: `supabase/migrations/add_inviter_invitee_habit_ids.sql`

### 2. Reload Your App

After running the migration, **reload your app** to get the new code.

### 3. Test It

1. **User A** creates a custom habit "Walk the Dog"
2. **User A** invites **User B** to track it together
3. **User B** accepts the invite
4. **Both users** should now see:
   - ✅ The habit in their custom habits list
   - ✅ The partner's avatar on the habit card
   - ✅ The nudge button (if partner hasn't completed)
   - ✅ Partner's completion status

## What Changed

### Database Schema (`habit_accountability_partners` table)
**Added columns:**
- `inviter_habit_id` (UUID) - Stores the inviter's custom habit ID
- `invitee_habit_id` (UUID) - Stores the invitee's custom habit ID
- `custom_habit_id` (UUID) - Kept for backwards compatibility

### Code Changes

#### 1. `types/database.ts`
Added new fields to `HabitAccountabilityPartner` interface:
```typescript
inviter_habit_id?: string;
invitee_habit_id?: string;
```

#### 2. `lib/habitInviteService.ts`

**`sendHabitInvite()`** - Now sets both fields when creating invite:
```typescript
inviter_habit_id: customHabitId,
invitee_habit_id: null, // Will be set when invitee accepts
```

**`acceptInvite()`** - Now updates `invitee_habit_id` instead of `custom_habit_id`:
```typescript
await supabase
  .from('habit_accountability_partners')
  .update({ invitee_habit_id: newHabitId })
  .eq('id', partnershipId);
```

#### 3. `screens/ActionScreen.tsx`

**`loadActivePartnerships()`** - Now determines which habit ID to use based on user role:
```typescript
// For current user's habit lookup
let habitId = user.id === p.inviter_id 
  ? p.inviter_habit_id 
  : p.invitee_habit_id;

// For partner's completion check
let partnerHabitId = user.id === p.inviter_id 
  ? p.invitee_habit_id 
  : p.inviter_habit_id;
```

## How It Works Now

### When Sending an Invite:
```
1. Inviter has habit ID: abc-123
2. Create partnership:
   - inviter_habit_id: abc-123
   - invitee_habit_id: null
   - status: pending
```

### When Accepting an Invite:
```
1. Create habit for invitee → new ID: xyz-789
2. Update partnership:
   - inviter_habit_id: abc-123 (unchanged)
   - invitee_habit_id: xyz-789 (set)
   - status: accepted
```

### When Loading Partnerships:
```
For Inviter:
- Use inviter_habit_id (abc-123) to find their habit
- Use invitee_habit_id (xyz-789) to check partner's progress

For Invitee:
- Use invitee_habit_id (xyz-789) to find their habit
- Use inviter_habit_id (abc-123) to check partner's progress
```

## Benefits

✅ **Both users see the partnership** on their habit card  
✅ **Each user tracks their own habit copy** with their own progress  
✅ **Nudge system works for both users**  
✅ **Partner completion status shows correctly**  
✅ **Backwards compatible** with existing partnerships  

## Backwards Compatibility

The migration automatically copies `custom_habit_id` to `inviter_habit_id` for existing partnerships. The code includes fallbacks:

```typescript
if (!habitId) habitId = p.custom_habit_id; // Fallback for old partnerships
```

This ensures old partnerships continue to work while new ones use the improved system.

## Troubleshooting

### "Partnership still not showing"
1. Verify the migration ran successfully
2. Check that both `inviter_habit_id` and `invitee_habit_id` are set in the database
3. Reload your app completely
4. Try creating a new partnership (old ones might need manual database fixes)

### "Partner completion not showing"
Check the console logs for `[WhiteHabitCard]` - it will show if `partnerStatus` is being loaded correctly.

### "Nudge button not appearing"
1. Click the partner avatar to see debug info
2. Check if `partnerStatus` is defined
3. Verify partnerships are loading with `[ActionScreen] Loaded nudge times`

---

## For Existing Partnerships

If you have existing partnerships that are broken, you can fix them manually in Supabase:

1. Go to **Table Editor** → `habit_accountability_partners`
2. Find the broken partnership
3. Set:
   - `inviter_habit_id` = the inviter's habit ID
   - `invitee_habit_id` = the invitee's habit ID
4. Reload the app

Or easier: Just **decline and re-accept** the invite to create a fresh partnership with the new structure!

