# Points System - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Create Database Tables (Required)
```
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy/paste contents of: create_points_system.sql
4. Click "Run"
5. Wait for "Success" message
```

### Step 2: Test the System
```
1. Start your app
2. Complete a daily habit (e.g., water intake)
3. Check Profile → Points should show
4. Like a post → Pink bar first segment should fill
5. Create a post → More points awarded
```

### Step 3: Verify Everything Works
```
✓ Daily habits award 15 pts each
✓ Like awards 10 pts (once per day)
✓ Comment awards 10 pts (once per day)
✓ Create post awards 15 pts (unlimited)
✓ Update goal awards 25 pts (unlimited)
✓ Pink bar has 5 segments (not 8)
✓ Profile shows "Points" not "Score"
✓ Points accumulate over time
```

## 📊 Points At A Glance

| Action | Points | Limit |
|--------|--------|-------|
| Complete any daily habit | 15 | Once per habit per day |
| Like a post | 10 | First like only |
| Comment on a post | 10 | First comment only |
| Create any post | 15 | Unlimited |
| Update goal with photo | 25 | Unlimited |
| Complete all habits | 20 | Bonus, once per day |

**Max per day:** 200 pts (220 with bonus)

## 🎯 Pink Bar (5 Segments)

Located on Profile page, shows:
1. **Like** - Filled when you like any post today
2. **Comment** - Filled when you comment on any post today
3. **Share** - Filled when you create any post today
4. **Update Goal** - Filled when you update a goal with photo today
5. **Bonus** - Filled when all 8 daily habits + all 4 core habits complete

## ⚠️ Important Notes

- **4am Reset:** Day starts at 4am, not midnight
- **No Backdating:** Old check-ins don't award points
- **Cumulative:** Points never decrease, only increase
- **Daily Limits:** Like & comment points only once per day
- **Unlimited:** Share & update goal can earn multiple times per day

## 🐛 Troubleshooting

**Points not showing?**
- Did you run the SQL script?
- Is user logged in?
- Check browser console for errors

**Pink bar not updating?**
- Close and reopen Profile screen
- Check if action was completed today (after 4am)

**Bonus not awarded?**
- Must complete ALL 8 daily habits
- Must complete ALL 4 core habits (like, comment, share, update goal)
- All on same day

## 📚 Need More Info?

- **Complete Guide:** `POINTS_SYSTEM_IMPLEMENTATION.md`
- **Next Steps:** `NEXT_STEPS.md`
- **Summary:** `IMPLEMENTATION_SUMMARY.md`

## ✅ That's It!

The system is ready to use once you create the database tables.

