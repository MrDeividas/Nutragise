# Points System Implementation Guide

## Overview

The new points system has been implemented to replace the quiz-based scoring. Users now earn points through daily habits and core app interactions, with cumulative totals that persist over time.

## Points Structure

### Daily Habits (Max 120 points per day)
- **Gym**: 15 pts
- **Meditation**: 15 pts  
- **Microlearn**: 15 pts
- **Sleep**: 15 pts
- **Water**: 15 pts
- **Run**: 15 pts
- **Reflect**: 15 pts
- **Cold Shower**: 15 pts

### Core Habits (Max 80 points per day)
- **Like**: 10 pts (first like per day only)
- **Comment**: 10 pts (first comment per day only)
- **Share**: 15 pts (creating a post/daily update)
- **Update Goal**: 25 pts (creating check-in/progress photo for any goal)
- **Bonus**: 20 pts (awarded when all 8 daily habits + all 4 core habits are completed in one day)

**Total possible per day**: 200 points

## Key Features

### 4am Daily Reset
- The day resets at 4am (not midnight)
- Points earned are cumulative (totals keep growing)
- Daily tracking resets at 4am (core habits tracked per day reset)
- If it's before 4am, the system treats it as the previous day

### Backdated Actions Prevention
- **Critical**: Points are ONLY awarded if the action is for TODAY (current date after 4am)
- Overdue check-ins or backdated habits are marked complete but DO NOT award points
- This prevents users from gaming the system by backdating entries

## Implementation Details

### Database Tables

#### `user_points_daily`
Tracks daily completion status and points:
- Primary key: (user_id, date)
- Tracks completion of each habit (gym_completed, meditation_completed, etc.)
- Tracks core habit completion (liked_today, commented_today, shared_today, updated_goal_today)
- Stores point breakdowns (daily_habits_points, core_habits_points, bonus_points, total_points_today)

#### `user_points_total`
Stores cumulative points:
- Primary key: user_id
- total_points: running total of all points earned
- last_updated: timestamp of last points update

### Services

#### `lib/pointsService.ts`
Core service handling all points logic:

**Key Methods:**
- `calculateDailyHabitsPoints(dailyHabits)`: Calculate points from daily_habits data
- `trackCoreHabit(userId, habitType)`: Track and award points for core habits
- `updateDailyHabitsPoints(userId, dailyHabits, date)`: Update points when habits are saved
- `checkAndAwardBonus(userId, date)`: Check if all habits complete and award bonus
- `getTodaysPoints(userId)`: Get breakdown of today's points
- `getTotalPoints(userId)`: Get cumulative total
- `getCoreHabitsStatus(userId)`: Get which core habits are completed today

**Important Features:**
- 4am cutoff logic: `getCurrentDateFor4amCutoff()`
- Backdating prevention: `isToday(dateString)` checks before awarding points
- Automatic bonus calculation when all habits are complete

### State Management

#### `state/actionStore.ts`
Extended to track core habits:

**New State:**
- `coreHabitsCompleted`: Array of 5 booleans [like, comment, share, update_goal, bonus]

**New Actions:**
- `loadCoreHabitsStatus()`: Load today's core habits completion status
- `trackCoreHabit(habitType)`: Track a core habit and update points

**Integration:**
- `saveDailyHabits()` now calls `pointsService.updateDailyHabitsPoints()`
- Points are automatically calculated when habits are saved

### UI Integration

#### Profile Screen Pink Bar
- Changed from 8 segments (daily habits) to 5 segments (core habits)
- Segments now represent: Like, Comment, Share, Update Goal, Bonus
- Dynamically updates based on `coreHabitsCompleted` from actionStore
- Located in `screens/ProfileScreen.tsx` lines 912-950

#### Points Display
- Profile expanded section shows "Points" instead of "Score"
- Displays cumulative total from `pointsService.getTotalPoints()`
- Updates automatically when user earns points

### Component Integrations

#### Like Tracking
**Files:**
- `components/PostLikeButton.tsx`
- `components/DailyPostLikeButton.tsx`

**Implementation:**
- Calls `trackCoreHabit('like')` when user likes a post
- Only awards points for FIRST like of the day
- Points service handles the daily limit logic

#### Comment Tracking
**File:** `components/PostCommentModal.tsx`

**Implementation:**
- Calls `trackCoreHabit('comment')` when user posts a comment (not replies)
- Only awards points for FIRST comment of the day
- Replies do not count toward points

#### Share & Update Goal Tracking
**File:** `components/CreatePostModal.tsx`

**Implementation:**
- Calls `trackCoreHabit('share')` when any post is created
- Calls `trackCoreHabit('update_goal')` when post includes a goal + photos
- Both can be earned in same action (creating a goal update post)

### Old System Removal

**File:** `screens/InformationDetailScreen.tsx`

**Changes:**
- Removed `points_earned` from quiz upsert
- Removed point display from success message
- Quiz completion still tracked but doesn't award points
- Maintains all other quiz functionality

## Usage Examples

### For Users:
1. **Daily Routine**: Complete all 8 daily habits = 120 pts
2. **Social Engagement**: Like a post (10 pts) + Comment (10 pts) = 20 pts  
3. **Goal Update**: Create a post with goal + photo = 15 (share) + 25 (update) = 40 pts
4. **Perfect Day**: All habits + all core actions = 200 pts + 20 bonus = 220 pts total

### For Developers:

**Track a custom habit:**
```typescript
import { pointsService } from '../lib/pointsService';

// Track meditation (not in DB)
await pointsService.trackDailyHabit(userId, 'meditation');

// Track a core habit
await pointsService.trackCoreHabit(userId, 'like');
```

**Get points:**
```typescript
// Today's breakdown
const todayPoints = await pointsService.getTodaysPoints(userId);
// { daily: 45, core: 20, bonus: 0, total: 65 }

// Cumulative total
const totalPoints = await pointsService.getTotalPoints(userId);
// e.g. 2450
```

**Check core habits status:**
```typescript
const status = await pointsService.getCoreHabitsStatus(userId);
// { liked: true, commented: false, shared: true, updatedGoal: false, bonus: false }
```

## Testing Checklist

- [ ] Create database tables using `create_points_system.sql`
- [ ] Test daily habits completion awards correct points
- [ ] Test core habits (like, comment, share, update goal) award points
- [ ] Verify like/comment only award points once per day
- [ ] Verify bonus awarded when all habits complete
- [ ] Test 4am cutoff (before 4am should use previous day)
- [ ] Test backdated check-ins don't award points
- [ ] Verify pink bar updates in real-time
- [ ] Verify cumulative points display in profile
- [ ] Test quiz completion doesn't award points anymore

## Database Setup

Run the SQL migration:
```bash
# Copy create_points_system.sql to your Supabase SQL editor and run it
```

This will:
1. Create `user_points_daily` table
2. Create `user_points_total` table
3. Enable RLS policies
4. Create indexes for performance
5. Add update triggers

## Future Enhancements

Potential additions (not yet implemented):
- Admin dashboard to view user points
- Leaderboards based on points
- Point-based achievements/badges
- Weekly/monthly point summaries
- Point history/analytics
- Export points data

## Troubleshooting

**Points not updating:**
- Check if action is for today (4am cutoff)
- Verify user is authenticated
- Check browser console for errors
- Verify database tables exist

**Bonus not awarded:**
- Ensure ALL 8 daily habits are complete
- Ensure ALL 4 core habits are complete
- Check that date matches (4am cutoff)

**Pink bar not updating:**
- Call `loadCoreHabitsStatus()` after actions
- Check actionStore.coreHabitsCompleted state
- Verify trackCoreHabit is being called

## Notes

- Points are cumulative and never decrease
- Daily tracking resets at 4am, but total points persist
- Backdated actions complete successfully but don't award points
- Share points can be earned multiple times per day (each post)
- Update goal points can be earned multiple times per day (each goal update)
- Like and comment points are limited to once per day

