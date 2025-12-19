# Security Fix Impact Analysis
**Date:** December 2024  
**Purpose:** Assess functionality impact of implementing security fixes

---

## Executive Summary

**Overall Impact:** 🟡 **MODERATE** - Some features will need code changes, but functionality can be preserved with proper implementation.

**Breaking Changes:** 2 features will break without code changes  
**Non-Breaking Changes:** 8 fixes can be implemented without breaking functionality  
**Code Changes Required:** 3-4 files need updates

---

## 1. Critical Issues - Impact Analysis

### 1.1 Public Read Access to `daily_habits` and `user_points_daily`

**Current Usage:**
- ✅ **Feed Feature** (`screens/HomeScreen.tsx:938-952`): Fetches habits/points for multiple users to display in the social feed
- ✅ **User Profile Viewing** (`screens/UserProfileScreen.tsx:167`): Views other users' habits when viewing their profile
- ✅ **Feed Display** (`screens/HomeScreen.tsx:2473`): Shows habit completion data in daily posts

**Impact if Fixed:**
- 🔴 **WILL BREAK** - Feed will fail to load other users' habit data
- 🔴 **WILL BREAK** - User profile viewing will fail
- 🔴 **WILL BREAK** - Daily posts won't show habit completion indicators

**Solution Required:**
```sql
-- Option 1: Allow authenticated users to view (recommended)
CREATE POLICY "Authenticated users can view daily habits" ON daily_habits
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Option 2: Follower-based access (more secure, better UX)
CREATE POLICY "Users can view followed users' habits" ON daily_habits
  FOR SELECT
  USING (
    auth.uid() = user_id OR  -- Own data
    EXISTS (
      SELECT 1 FROM followers 
      WHERE follower_id = auth.uid() 
      AND following_id = daily_habits.user_id
    )
  );
```

**Code Changes Needed:**
- ✅ **No app code changes** if using Option 1 (authenticated users only)
- ⚠️ **Minor changes** if using Option 2 (need to ensure users are following each other)

**Recommendation:** Use Option 1 initially (quick fix), then migrate to Option 2 for better privacy.

---

### 1.2 Missing Authentication in Edge Functions

**Current Usage:**
- ✅ **Payment Intent Creation** (`lib/stripeService.ts:60-71`): Calls edge function with `SUPABASE_ANON_KEY`
- ✅ **Challenge Payments** (`lib/challengesService.ts:282`): Similar pattern

**Current Code:**
```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-intent`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SUPABASE_ANON_KEY || ''}`,  // ⚠️ Uses anon key, not user token
  },
  body: JSON.stringify({
    amount,
    userId,  // ⚠️ User ID from request, not validated
    currency: 'gbp',
  }),
});
```

**Impact if Fixed:**
- 🔴 **WILL BREAK** - Payment intent creation will fail (401 Unauthorized)
- 🔴 **WILL BREAK** - Challenge payments will fail

**Solution Required:**
1. **Update Edge Function** to validate JWT token:
```typescript
// In edge function
const authHeader = req.headers.get('Authorization')
if (!authHeader) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
}

const token = authHeader.replace('Bearer ', '')
const { data: { user }, error } = await supabase.auth.getUser(token)

if (error || !user) {
  return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 })
}

// Use authenticated user ID
const userId = user.id  // Don't trust userId from request body
```

2. **Update App Code** to send user's JWT token:
```typescript
// In lib/stripeService.ts
const { data: { session } } = await supabase.auth.getSession()
if (!session?.access_token) {
  throw new Error('User not authenticated')
}

const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-intent`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,  // ✅ Use user's JWT token
  },
  body: JSON.stringify({
    amount,
    // ✅ Remove userId from body - use authenticated user from token
    currency: 'gbp',
  }),
});
```

**Code Changes Needed:**
- ✅ **2 files**: `lib/stripeService.ts` and `lib/challengesService.ts`
- ✅ **All edge functions**: Add authentication validation

**Recommendation:** This is a **critical security fix** - implement immediately. The code changes are straightforward.

---

### 1.3 Missing User ID Validation in Service Functions

**Current Usage:**
- ✅ **Workout Service** (`lib/workoutService.ts:27`): `fetchExercises(userId)` - no validation
- ✅ **Wallet Service** (`lib/walletService.ts:17`): `getWallet(userId)` - no validation
- ✅ **Most other services**: Similar pattern

**Impact if Fixed:**
- ✅ **NO BREAKING CHANGES** - If RLS is properly configured, this is just defense-in-depth
- ⚠️ **Minor performance impact** - Extra auth check per request

**Solution Required:**
```typescript
// Add to all service functions
async fetchExercises(userId: string): Promise<WorkoutExercise[]> {
  // Validate user ID
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    throw new Error('Unauthorized')
  }
  
  // Existing code...
  const { data, error } = await supabase
    .from<WorkoutExercise>(WORKOUT_EXERCISES_TABLE)
    .select('*')
    .eq('user_id', userId)  // RLS will also enforce this
    .order('created_at', { ascending: false });
}
```

**Code Changes Needed:**
- ⚠️ **Multiple files**: Add validation to ~15-20 service functions
- ✅ **No breaking changes** - Just adds security layer

**Recommendation:** Implement gradually - start with sensitive operations (wallet, payments), then expand to others.

---

## 2. High Priority Issues - Impact Analysis

### 2.1 SQL Injection Risk in Search

**Current Usage:**
- ✅ **Goal Search** (`lib/socialService.ts:498`): User search functionality

**Impact if Fixed:**
- ✅ **NO BREAKING CHANGES** - Supabase PostgREST already handles this safely
- ✅ **No code changes needed** - Current implementation is actually safe

**Recommendation:** This is a **false positive** - Supabase's query builder prevents SQL injection. No action needed.

---

### 2.2 CORS - Overly Permissive

**Current Usage:**
- ✅ **Edge Functions**: All allow `*` origin

**Impact if Fixed:**
- ⚠️ **POTENTIAL BREAKING** - If app is accessed from web, need to whitelist domains
- ✅ **NO IMPACT** - If app is mobile-only (React Native), CORS doesn't apply

**Solution Required:**
```typescript
// In edge functions
const allowedOrigins = [
  'https://yourdomain.com',
  'capacitor://localhost',  // For Capacitor apps
  'ionic://localhost',      // For Ionic apps
]

const origin = req.headers.get('Origin')
if (origin && !allowedOrigins.includes(origin)) {
  return new Response(JSON.stringify({ error: "CORS not allowed" }), { status: 403 })
}

headers: {
  "Access-Control-Allow-Origin": origin || "*",
  ...
}
```

**Code Changes Needed:**
- ✅ **Edge functions only** - No app code changes
- ⚠️ **Need to know** - What domains/origins should be allowed?

**Recommendation:** If mobile-only app, this is low priority. If web app exists, fix immediately.

---

### 2.3 Missing Input Validation

**Impact if Fixed:**
- ✅ **NO BREAKING CHANGES** - Just adds validation
- ✅ **Improves UX** - Better error messages

**Code Changes Needed:**
- ✅ **Edge functions only** - No app code changes

---

## 3. Summary Table

| Issue | Severity | Will Break? | Code Changes | Estimated Time |
|-------|----------|-------------|--------------|----------------|
| Public read access to habits | 🔴 Critical | ✅ YES | SQL only (no app code) | 30 min |
| Missing edge function auth | 🔴 Critical | ✅ YES | 2 app files + edge functions | 2 hours |
| User ID validation | 🟡 High | ❌ NO | 15-20 service files | 4 hours |
| SQL injection | 🟡 High | ❌ NO | None (false positive) | 0 min |
| CORS | 🟡 High | ⚠️ Maybe | Edge functions only | 1 hour |
| Input validation | 🟡 High | ❌ NO | Edge functions only | 2 hours |

---

## 4. Implementation Plan

### Phase 1: Critical Fixes (Do First - 1 day)
1. ✅ **Fix public read access** - Change RLS policy to authenticated users only
   - **Impact:** Feed will still work (users are authenticated)
   - **Time:** 30 minutes
   - **Risk:** Low

2. ✅ **Add authentication to edge functions**
   - **Impact:** Need to update app code to send JWT tokens
   - **Time:** 2-3 hours
   - **Risk:** Medium (need to test payment flows)

### Phase 2: High Priority (Do Next - 1 week)
3. ✅ **Add user ID validation** to sensitive services (wallet, payments)
   - **Impact:** No breaking changes
   - **Time:** 2 hours
   - **Risk:** Low

4. ✅ **Add input validation** to edge functions
   - **Impact:** No breaking changes
   - **Time:** 2 hours
   - **Risk:** Low

5. ⚠️ **Fix CORS** (if web app exists)
   - **Impact:** Need to know allowed origins
   - **Time:** 1 hour
   - **Risk:** Low

### Phase 3: Medium Priority (Do Later - 2 weeks)
6. ✅ **Add user ID validation** to all other services
   - **Impact:** No breaking changes
   - **Time:** 4 hours
   - **Risk:** Low

---

## 5. Testing Checklist

After implementing fixes, test:

- [ ] Feed loads and displays other users' habits ✅
- [ ] User profiles can view other users' habits ✅
- [ ] Payment intent creation works ✅
- [ ] Challenge payments work ✅
- [ ] Wallet deposits work ✅
- [ ] All service functions work (workout, goals, etc.) ✅
- [ ] Search functionality works ✅
- [ ] No new errors in console ✅

---

## 6. Rollback Plan

If something breaks:

1. **Public read access:** Revert RLS policy change
   ```sql
   DROP POLICY "Authenticated users can view daily habits" ON daily_habits;
   CREATE POLICY "Public can view daily habits" ON daily_habits FOR SELECT USING (true);
   ```

2. **Edge function auth:** Revert edge function code (remove auth check)
   - Keep app code changes (they're safe)
   - Just remove auth validation from edge function temporarily

3. **User ID validation:** Remove validation checks (they're defense-in-depth, not critical)

---

## 7. Recommendations

### Immediate Actions (This Week):
1. ✅ **Fix public read access** - Low risk, high security value
2. ✅ **Add edge function authentication** - Critical for payment security
3. ✅ **Test thoroughly** - Especially payment flows

### Short-term (This Month):
4. ✅ **Add user ID validation** to sensitive services
5. ✅ **Add input validation** to edge functions
6. ⚠️ **Fix CORS** (if applicable)

### Long-term (Next Quarter):
7. ✅ **Add user ID validation** to all services
8. ✅ **Implement follower-based access** for habits (better privacy)
9. ✅ **Security audit** after all fixes

---

## Conclusion

**Good News:** Most fixes won't break functionality if implemented correctly.

**Critical Path:**
1. Fix public read access (30 min) - **Feed will still work**
2. Add edge function auth (2-3 hours) - **Need app code changes**
3. Test payment flows thoroughly

**Estimated Total Time:** 1-2 days for critical fixes, 1 week for all high-priority fixes.

**Risk Level:** 🟡 **MODERATE** - Some breaking changes, but all can be fixed with proper implementation.

---

**Next Steps:**
1. Review this analysis
2. Decide on implementation timeline
3. Start with Phase 1 (critical fixes)
4. Test thoroughly before deploying

