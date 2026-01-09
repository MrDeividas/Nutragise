# Testing Checklist - Post Security Fixes

Use this checklist to verify all functionality still works after the security fixes.

---

## Pre-Testing Setup

- [ ] App is running with latest code
- [ ] Edge functions are deployed with latest changes
- [ ] You're logged in as a test user
- [ ] You have test payment methods available (if testing payments)

---

## Test 1: Payment Intent Creation Flow ✅

**Purpose**: Verify wallet deposit still works after JWT authentication changes

### Steps:
1. [ ] Navigate to Wallet screen
2. [ ] Click "Add Funds" or similar button
3. [ ] Enter a small test amount (e.g., £1.00)
4. [ ] Proceed to payment
5. [ ] Complete payment with test card

### Expected Results:
- [ ] Payment intent is created successfully
- [ ] Stripe Payment Sheet appears
- [ ] Payment completes successfully
- [ ] Wallet balance updates correctly
- [ ] No authentication errors in console

### If It Fails:
- Check console for "Unauthorized" errors
- Verify user is logged in
- Check edge function logs in Supabase Dashboard

**Status**: [ ] Pass | [ ] Fail | [ ] Not Tested

---

## Test 2: Challenge Payment Flow ✅

**Purpose**: Verify challenge payments work after authentication fixes

### Steps:
1. [ ] Navigate to a paid challenge (entry fee > £0)
2. [ ] Click "Join Challenge"
3. [ ] Confirm payment amount
4. [ ] Complete payment with test card

### Expected Results:
- [ ] Challenge payment intent created
- [ ] Payment Sheet appears
- [ ] Payment completes
- [ ] User is added to challenge participants
- [ ] Challenge appears in "My Challenges"
- [ ] No authentication errors

### If It Fails:
- Check if challenge has entry fee
- Verify user has sufficient balance (if using wallet)
- Check edge function logs

**Status**: [ ] Pass | [ ] Fail | [ ] Not Tested

---

## Test 3: Subscription Upgrade Flow ✅

**Purpose**: Verify Pro subscription upgrade works end-to-end

### Steps:
1. [ ] Navigate to a Pro-only feature (or Profile → Upgrade)
2. [ ] Click "Upgrade to Pro"
3. [ ] Review Pro features and price
4. [ ] Click "Subscribe" or "Upgrade"
5. [ ] Complete payment with test card

### Expected Results:
- [ ] Payment Sheet appears
- [ ] Payment completes successfully
- [ ] User's `is_pro` status updates to `true`
- [ ] Pro features become accessible
- [ ] Subscription appears in Stripe Dashboard
- [ ] Webhook receives and processes event

### If It Fails:
- Check Stripe Dashboard for subscription
- Verify webhook is receiving events
- Check database: `SELECT is_pro, subscription_status FROM profiles WHERE id = 'your_user_id'`

**Status**: [ ] Pass | [ ] Fail | [ ] Not Tested

---

## Test 4: Feed Still Loads ✅

**Purpose**: Verify feed works after RLS policy changes

### Steps:
1. [ ] Navigate to Community/Feed screen
2. [ ] Wait for feed to load
3. [ ] Scroll through feed items
4. [ ] Check if other users' posts/habits are visible

### Expected Results:
- [ ] Feed loads without errors
- [ ] Other users' daily habits are visible
- [ ] Other users' posts are visible
- [ ] Habit completion indicators show correctly
- [ ] No "permission denied" errors

### If It Fails:
- Check console for RLS errors
- Verify you're logged in (authenticated)
- Check if RLS migration was applied: Run `fix_public_habits_read_access.sql`

**Status**: [ ] Pass | [ ] Fail | [ ] Not Tested

---

## Test 5: User Profiles View Other Users Data ✅

**Purpose**: Verify viewing other users' profiles works after RLS changes

### Steps:
1. [ ] Navigate to another user's profile
2. [ ] View their recent activity
3. [ ] Check their habit completion data
4. [ ] View their challenge participation

### Expected Results:
- [ ] Profile loads successfully
- [ ] Other user's habits are visible
- [ ] Other user's points are visible
- [ ] Recent activity shows correctly
- [ ] No permission errors

### If It Fails:
- Verify you're logged in
- Check RLS policies are set to "authenticated users"
- Check console for specific error messages

**Status**: [ ] Pass | [ ] Fail | [ ] Not Tested

---

## Additional Tests (Recommended)

### Test 6: Input Validation
- [ ] Try to create payment with negative amount → Should show error
- [ ] Try to create payment with amount > £10,000 → Should show error
- [ ] Try to create payment with invalid currency → Should show error

### Test 7: Authentication Edge Cases
- [ ] Try to access wallet with expired session → Should prompt re-login
- [ ] Try to join challenge while logged out → Should show auth error

### Test 8: Error Handling
- [ ] Check error messages are user-friendly (no stack traces)
- [ ] Verify errors don't expose sensitive information

---

## Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Payment Intent Creation | [ ] | |
| Challenge Payment | [ ] | |
| Subscription Upgrade | [ ] | |
| Feed Loading | [ ] | |
| User Profile Viewing | [ ] | |

---

## Common Issues & Solutions

### Issue: "Unauthorized" errors
**Solution**: 
- Verify user is logged in
- Check JWT token is being sent in requests
- Verify edge functions are deployed with latest code

### Issue: Feed not loading
**Solution**:
- Check RLS migration was applied
- Verify policy allows authenticated users
- Check user is authenticated

### Issue: Payment fails
**Solution**:
- Check Stripe keys are correct (test vs live)
- Verify edge function secrets are set
- Check Stripe Dashboard for error details

### Issue: Webhook not updating status
**Solution**:
- Verify webhook secret matches
- Check webhook is receiving events in Stripe Dashboard
- Check edge function logs for errors

---

## Next Steps After Testing

- ✅ All tests pass → Ready for production deployment
- ⚠️ Some tests fail → Fix issues before deploying
- ❌ Critical tests fail → Review security fixes, may need rollback

---

**Testing Date**: _______________
**Tester**: _______________
**Environment**: [ ] Development | [ ] Staging | [ ] Production
