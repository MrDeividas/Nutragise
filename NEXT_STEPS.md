# Points System - Next Steps

## Immediate Actions Required

### 1. Create Database Tables
**Priority: HIGH - Required before testing**

Run the SQL script in your Supabase dashboard:
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `create_points_system.sql`
3. Execute the SQL script
4. Verify tables created:
   - `user_points_daily`
   - `user_points_total`

### 2. Test the Implementation
**Priority: HIGH**

Start the app and test each feature:

**Daily Habits:**
- [ ] Complete a daily habit (e.g., water, gym, sleep)
- [ ] Verify points awarded (15 pts per habit)
- [ ] Check that points show in Profile

**Core Habits:**
- [ ] Like a post → Should award 10 pts (first like of day)
- [ ] Like another post → Should NOT award more points
- [ ] Comment on a post → Should award 10 pts (first comment of day)
- [ ] Create a post → Should award 15 pts (share)
- [ ] Create post with goal + photo → Should award 15 + 25 = 40 pts

**Pink Bar (Profile Page):**
- [ ] Check that 5 segments show
- [ ] Like a post → first segment should fill
- [ ] Comment → second segment should fill
- [ ] Create post → third segment should fill
- [ ] Update goal → fourth segment should fill
- [ ] Complete all 8 daily + all 4 core → fifth segment (bonus) should fill

**Points Display:**
- [ ] Profile page shows "Points" instead of "Score"
- [ ] Total accumulates correctly
- [ ] Points persist after app restart

### 3. Handle Meditation & Microlearn Tracking
**Priority: MEDIUM - These habits don't auto-track yet**

Currently, the system can calculate points for meditation and microlearn, but you need to call the tracking when users complete these activities.

**Where to add:**
- Find where meditation completion is tracked
- Call: `pointsService.trackDailyHabit(userId, 'meditation')`
- Find where microlearning completion is tracked  
- Call: `pointsService.trackDailyHabit(userId, 'microlearn')`

### 4. Update ActionScreen Pink Bar (Optional)
**Priority: LOW - Profile already has it**

The ActionScreen also has a pink bar that could be updated to show core habits.

**File:** `screens/ActionScreen.tsx`

Look for the pink progress bar rendering and update it similar to ProfileScreen.

## Optional Enhancements

### 1. Daily Reset Automation
Currently, the 4am reset logic is built into the points service (it won't award points for backdated actions). However, you could add a background job to explicitly reset daily tracking:

**Options:**
- Supabase Edge Function with cron job
- On app open, check if new day and reset
- React Native background task

### 2. Points Animation
Add visual feedback when points are earned:
- Toast notification: "+15 points earned!"
- Animated counter in profile
- Celebratory animation for bonus

### 3. Points History
Create a screen showing:
- Daily points breakdown
- Weekly/monthly trends
- Point earning history

### 4. Leaderboard
Rank users by total points:
- Weekly leaderboard
- All-time leaderboard
- Friends leaderboard

## Testing 4am Cutoff

To test the 4am cutoff without waiting:

**Option 1: Manual testing**
- Wait until after midnight but before 4am
- Complete a habit
- Points should be attributed to previous day

**Option 2: Modify code temporarily**
In `lib/pointsService.ts`, change the cutoff hour:
```typescript
// Change from 4 to current hour + 1 for testing
if (hour < 5) { // Instead of 4
```

## Common Issues & Solutions

**Issue: Points not showing up**
- Solution: Check database tables exist, verify user is logged in, check console for errors

**Issue: Pink bar not updating**
- Solution: Ensure `loadCoreHabitsStatus()` is called on screen focus

**Issue: Bonus not awarded**
- Solution: Must complete ALL 8 daily habits + ALL 4 core habits on same day

**Issue: Points awarded for old check-ins**
- Solution: The system should prevent this via `isToday()` check, verify the date logic

## Monitoring Points

Query to check a user's points:
```sql
-- See today's activity
SELECT * FROM user_points_daily 
WHERE user_id = 'USER_ID' 
ORDER BY date DESC 
LIMIT 7;

-- See total points
SELECT * FROM user_points_total 
WHERE user_id = 'USER_ID';
```

## Files Modified

Core implementation:
- ✅ `create_points_system.sql` - Database schema
- ✅ `lib/pointsService.ts` - Points calculation logic
- ✅ `state/actionStore.ts` - Core habits state management
- ✅ `screens/ProfileScreen.tsx` - Pink bar + points display
- ✅ `components/PostLikeButton.tsx` - Like tracking
- ✅ `components/DailyPostLikeButton.tsx` - Daily post like tracking
- ✅ `components/PostCommentModal.tsx` - Comment tracking
- ✅ `components/CreatePostModal.tsx` - Share + update goal tracking
- ✅ `screens/InformationDetailScreen.tsx` - Removed quiz points

Documentation:
- ✅ `POINTS_SYSTEM_IMPLEMENTATION.md` - Complete guide
- ✅ `NEXT_STEPS.md` - This file

## Questions?

Refer to `POINTS_SYSTEM_IMPLEMENTATION.md` for:
- Detailed architecture explanation
- Code examples
- API reference
- Troubleshooting guide

