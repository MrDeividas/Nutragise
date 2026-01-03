# Habit Invite Snapshot Fix

## Problem
When accepting a custom habit invite, the habit wasn't being created for the invitee. This happened because:
1. The inviter created a custom habit (e.g., "walk dog")
2. They sent you an invite with the habit ID
3. **The inviter deleted their habit** (or it was removed)
4. When you accepted, the system couldn't find the habit to copy

## Solution
Now when someone sends you a custom habit invite, the system **saves a snapshot** of the habit details at invitation time. This means:
- ✅ Even if the inviter deletes their habit, you can still create it
- ✅ You get the exact habit details (schedule, icon, description, etc.)
- ✅ The habit is preserved in the partnership data

## Setup Instructions

### 1. Run the Database Migration

In your terminal, navigate to your project directory and run:

```bash
cd "/Users/mac/Documents/nutrapp Test design"
```

Then run the SQL migration in your Supabase dashboard:
- Go to **SQL Editor**
- Copy and paste the contents of `supabase/migrations/add_habit_snapshot_column.sql`
- Click **Run**

Or if you have the Supabase CLI:
```bash
supabase db push
```

### 2. Reload Your App

After running the migration, **reload your app** to get the new code.

### 3. Test It

#### Testing New Invites:
1. Have someone create a custom habit and invite you
2. Have them **delete** their habit
3. Accept the invite
4. The habit should now appear in your custom habits! ✅

#### For Old Invites (Already Accepted):
If you already accepted invites that didn't create habits:
1. Ask the person to **re-send the invite** (if they still have the habit)
2. Accept the new invite
3. The habit should be created now

#### For Old Invites (Inviter Deleted Habit):
Unfortunately, if:
- You already accepted an invite
- The habit wasn't created
- The inviter deleted their habit
- The invite was sent **before this fix**

Then there's no way to recover that habit data. You'll need to:
- Ask the inviter to **recreate** the habit
- Have them send a **new invite**

## What Changed

### Database
- Added `habit_snapshot` column to `habit_accountability_partners` table
- Stores full habit details (JSONB) when invite is sent

### Code Changes

#### 1. `types/database.ts`
- Added `habit_snapshot?: any` to `HabitAccountabilityPartner` interface

#### 2. `lib/habitInviteService.ts`
- **`sendHabitInvite()`**: Now captures habit details and stores them in `habit_snapshot` when creating invites
- **`autoCreateHabitForInvitee()`**: 
  - First tries to fetch the habit by ID (in case it still exists)
  - Falls back to using `habit_snapshot` if habit is deleted
  - Creates the habit from snapshot data
- **`acceptInvite()`**: Passes `habit_snapshot` to `autoCreateHabitForInvitee()`

## How It Works

### When Sending an Invite:
```
1. Fetch habit details from database
2. Create snapshot with all fields (title, schedule, icon, etc.)
3. Store snapshot in partnership record
4. Send notification
```

### When Accepting an Invite:
```
1. Try to fetch habit by ID
2. If not found → use snapshot
3. Check if invitee already has this habit (by title)
4. If not → create habit from snapshot data
```

## Console Logs

You'll now see logs like:
```
[AutoCreate] Processing custom habit for invitee
[AutoCreate] Using habit snapshot (original habit not found)  ← New!
[AutoCreate] Creating custom habit copy for invitee: "walk dog"
[AutoCreate] Successfully created custom habit copy: "walk dog"
```

## Benefits

✅ **Inviter can delete their habits** without breaking your partnership  
✅ **More reliable** habit creation process  
✅ **Preserves habit data** at invitation time  
✅ **Better error handling** for deleted/missing habits  

---

## Troubleshooting

### "Habit still not appearing"
1. Check console logs for `[AutoCreate]` messages
2. Verify the migration ran successfully
3. Reload your app completely
4. Try declining and re-accepting the invite

### "Error running migration"
If you get an error about the column already existing, it's safe to ignore it. The migration uses `IF NOT EXISTS` to be idempotent.

### "Old invites still not working"
Old invites sent **before this fix** don't have snapshots. The person needs to send a **new invite** for this to work.

