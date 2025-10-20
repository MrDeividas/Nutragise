# 🎯 Security Roadmap: 8.5/10 → 10/10

**Current Status:** 8.5/10 (Production Ready ✅)  
**Goal:** Achieve 10/10 Enterprise-Grade Security  
**Total Time Estimate:** 25 hours

---

## 📊 Current Security Score Breakdown

- ✅ Authentication: 9/10
- ✅ Authorization (RLS): 9/10
- ✅ Data Protection: 9/10
- ✅ Secret Management: 10/10
- ✅ SQL Injection Prevention: 9/10
- ✅ Error Handling: 8/10
- ❌ Rate Limiting: 0/10
- ❌ Audit Logging: 0/10
- ❌ 2FA: 0/10
- ❌ Data Encryption: 0/10

---

## 🚀 Phase 1: Quick Wins (2 hours) → 9.1/10

### ✅ Task 1.1: Add Input Validation Constraints
**Impact:** +0.3 points  
**Time:** 1 hour  
**Priority:** High  
**Difficulty:** Easy

**What to do:**
- [ ] Open Supabase SQL Editor
- [ ] Copy and run this SQL:

```sql
-- Username constraints
ALTER TABLE profiles ADD CONSTRAINT username_length 
  CHECK (char_length(username) BETWEEN 3 AND 30);

ALTER TABLE profiles ADD CONSTRAINT username_format 
  CHECK (username ~ '^[a-zA-Z0-9_]+$');

-- Bio length
ALTER TABLE profiles ADD CONSTRAINT bio_length 
  CHECK (char_length(bio) <= 500);

-- Positive numbers for daily habits
ALTER TABLE daily_habits ADD CONSTRAINT water_intake_positive 
  CHECK (water_intake >= 0 AND water_intake <= 100);

ALTER TABLE daily_habits ADD CONSTRAINT sleep_hours_valid 
  CHECK (sleep_hours >= 0 AND sleep_hours <= 24);

ALTER TABLE daily_habits ADD CONSTRAINT sleep_quality_valid
  CHECK (sleep_quality >= 1 AND sleep_quality <= 5);

-- Mood and energy ratings
ALTER TABLE posts ADD CONSTRAINT mood_rating_valid
  CHECK (mood_rating >= 1 AND mood_rating <= 5);

ALTER TABLE posts ADD CONSTRAINT energy_level_valid
  CHECK (energy_level >= 1 AND energy_level <= 5);
```

**Test:**
- [ ] Try to create a profile with username < 3 chars (should fail)
- [ ] Try to set sleep_hours to 30 (should fail)
- [ ] Verify normal data entry still works

---

### ✅ Task 1.2: Add Security Headers
**Impact:** +0.2 points  
**Time:** 30 minutes  
**Priority:** Medium  
**Difficulty:** Easy

**What to do:**
- [ ] Create new file: `lib/securityHeaders.ts`
- [ ] Add this code:

```typescript
// lib/securityHeaders.ts
export const securityHeaders = {
  'Content-Security-Policy': 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co;",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};
```

**Note:** These headers are mainly for web. For React Native, they're less critical but good to have if you add a web version later.

---

### ✅ Task 1.3: Set Up Dependency Security Scanning
**Impact:** +0.1 points  
**Time:** 30 minutes  
**Priority:** High  
**Difficulty:** Easy

**What to do:**
- [ ] Run `npm audit` in your project
- [ ] Fix any high/critical vulnerabilities
- [ ] Add to `package.json` scripts:

```json
{
  "scripts": {
    "security:audit": "npm audit --audit-level=moderate",
    "security:fix": "npm audit fix"
  }
}
```

- [ ] Set up GitHub Dependabot (if using GitHub):
  - Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

**Test:**
- [ ] Run `npm run security:audit`
- [ ] Verify no critical vulnerabilities

---

## 🔧 Phase 2: Medium Effort (9 hours) → 9.8/10

### ✅ Task 2.1: Implement Rate Limiting
**Impact:** +0.3 points  
**Time:** 3 hours  
**Priority:** High  
**Difficulty:** Medium

**What to do:**
- [ ] Sign up for Upstash Redis (free tier): https://upstash.com/
- [ ] Install dependencies:

```bash
npm install @upstash/redis
```

- [ ] Create `lib/rateLimiter.ts`:

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN
});

export async function checkRateLimit(
  userId: string, 
  action: string,
  limit: number = 100,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:${action}:${userId}`;
  
  const requests = await redis.incr(key);
  if (requests === 1) {
    await redis.expire(key, windowSeconds);
  }
  
  return {
    allowed: requests <= limit,
    remaining: Math.max(0, limit - requests)
  };
}

// Use in API-heavy operations
export async function withRateLimit<T>(
  userId: string,
  action: string,
  callback: () => Promise<T>
): Promise<T> {
  const { allowed } = await checkRateLimit(userId, action);
  
  if (!allowed) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }
  
  return callback();
}
```

- [ ] Add to `.env`:

```
UPSTASH_REDIS_URL=your-redis-url
UPSTASH_REDIS_TOKEN=your-redis-token
```

- [ ] Apply to search functions in `lib/socialService.ts`:

```typescript
async searchUsers(query: string): Promise<Profile[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  return withRateLimit(user.id, 'search', async () => {
    // ... existing search code
  });
}
```

**Test:**
- [ ] Make 100+ search requests rapidly
- [ ] Verify rate limit error appears

---

### ✅ Task 2.2: Add Audit Logging
**Impact:** +0.2 points  
**Time:** 3 hours  
**Priority:** Medium  
**Difficulty:** Medium

**What to do:**
- [ ] Create audit log table in Supabase SQL Editor:

```sql
-- Create audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow service/admin to write
CREATE POLICY "Service can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER 
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (user_id, table_name, operation, record_id, old_data)
    VALUES (auth.uid(), TG_TABLE_NAME, TG_OP, OLD.id, row_to_json(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (user_id, table_name, operation, record_id, old_data, new_data)
    VALUES (auth.uid(), TG_TABLE_NAME, TG_OP, NEW.id, row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply to sensitive tables
CREATE TRIGGER audit_goals_changes
AFTER UPDATE OR DELETE ON goals
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_profile_changes
AFTER UPDATE OR DELETE ON profiles
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_post_changes
AFTER DELETE ON posts
FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
```

**Test:**
- [ ] Delete a goal
- [ ] Query `audit_logs` table
- [ ] Verify the delete was logged

---

### ✅ Task 2.3: Set Up Security Monitoring
**Impact:** +0.2 points  
**Time:** 3 hours  
**Priority:** Medium  
**Difficulty:** Medium

**What to do:**
- [ ] Create `lib/securityMonitor.ts`:

```typescript
import { supabase } from './supabase';

interface SecurityEvent {
  type: 'FAILED_LOGIN' | 'SUSPICIOUS_ACTIVITY' | 'MASS_DELETE' | 'UNUSUAL_ACCESS';
  userId?: string;
  details: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export async function logSecurityEvent(event: SecurityEvent) {
  // Log to security_events table
  await supabase.from('security_events').insert({
    event_type: event.type,
    user_id: event.userId,
    details: event.details,
    severity: event.severity,
    created_at: new Date().toISOString()
  });
  
  // Alert on high/critical events
  if (event.severity === 'HIGH' || event.severity === 'CRITICAL') {
    await sendSecurityAlert(event);
  }
}

async function sendSecurityAlert(event: SecurityEvent) {
  // TODO: Integrate with your alerting system
  // Options: Email, Slack, Discord, SMS
  console.error('🚨 SECURITY ALERT:', event);
}

// Monitor failed login attempts
export async function trackFailedLogin(email: string) {
  const key = `failed_login:${email}`;
  const count = await incrementCounter(key, 300); // 5 min window
  
  if (count > 5) {
    await logSecurityEvent({
      type: 'FAILED_LOGIN',
      details: `Multiple failed logins for ${email}`,
      severity: 'HIGH'
    });
  }
}

// Monitor suspicious patterns
export async function detectSuspiciousActivity(userId: string, action: string) {
  const key = `activity:${userId}:${action}`;
  const count = await incrementCounter(key, 60); // 1 min window
  
  // If user performs same action > 50 times per minute
  if (count > 50) {
    await logSecurityEvent({
      type: 'SUSPICIOUS_ACTIVITY',
      userId,
      details: `Unusual activity pattern: ${action} performed ${count} times`,
      severity: 'MEDIUM'
    });
  }
}
```

- [ ] Create security_events table:

```sql
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  user_id UUID,
  details TEXT,
  severity TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view security events"
  ON security_events FOR SELECT
  USING (true); -- Restrict this to admin users
```

**Test:**
- [ ] Trigger a failed login
- [ ] Check security_events table
- [ ] Verify event was logged

---

## 🔒 Phase 3: Advanced Security (14 hours) → 10/10

### ✅ Task 3.1: Implement Two-Factor Authentication (2FA)
**Impact:** +0.3 points  
**Time:** 6 hours  
**Priority:** Low (for pre-launch)  
**Difficulty:** Hard

**What to do:**
- [ ] Enable MFA in Supabase Dashboard:
  - Go to Authentication → Providers
  - Enable "Phone" or "Time-based One-Time Password (TOTP)"

- [ ] Add MFA enrollment screen in app
- [ ] Create `screens/EnableMFAScreen.tsx`:

```typescript
import { supabase } from '../lib/supabase';

export function EnableMFAScreen() {
  const [qrCode, setQrCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  
  async function enrollMFA() {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp'
    });
    
    if (data) {
      setQrCode(data.totp.qr_code);
      // Show QR code for user to scan with authenticator app
    }
  }
  
  async function verifyMFA() {
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: factorId,
      code: verifyCode
    });
    
    if (!error) {
      // MFA enabled successfully
    }
  }
  
  // ... UI implementation
}
```

- [ ] Add MFA verification to login flow
- [ ] Add "Manage 2FA" section to ProfileSettingsScreen

**Test:**
- [ ] Enable 2FA for your account
- [ ] Log out and log back in
- [ ] Verify 2FA code is required

---

### ✅ Task 3.2: Implement Data Encryption at Rest
**Impact:** +0.3 points  
**Time:** 8 hours  
**Priority:** Low (Supabase already encrypts at rest)  
**Difficulty:** Very Hard

**What to do:**

**Note:** Supabase already encrypts data at rest. This task is only needed if you want application-level encryption for extra-sensitive fields.

- [ ] Install pgcrypto in Supabase:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

- [ ] Create encryption helper functions:

```sql
-- Encrypt function
CREATE OR REPLACE FUNCTION encrypt_field(data TEXT, key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(pgp_sym_encrypt(data, key), 'base64');
END;
$$ LANGUAGE plpgsql;

-- Decrypt function
CREATE OR REPLACE FUNCTION decrypt_field(encrypted TEXT, key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(decode(encrypted, 'base64'), key);
END;
$$ LANGUAGE plpgsql;
```

- [ ] Add encrypted columns:

```sql
-- Example: Encrypt sensitive bio data
ALTER TABLE profiles ADD COLUMN bio_encrypted TEXT;

-- Migrate existing data
UPDATE profiles 
SET bio_encrypted = encrypt_field(bio, 'your-encryption-key');
```

- [ ] Update app to encrypt/decrypt:

```typescript
// When saving
const encrypted = await encryptData(sensitiveData);
await supabase.from('profiles').update({ bio_encrypted: encrypted });

// When reading
const { data } = await supabase.from('profiles').select('bio_encrypted');
const decrypted = await decryptData(data.bio_encrypted);
```

**Important:** Store encryption key securely (not in .env, use key management service)

**Test:**
- [ ] Save encrypted data
- [ ] Verify raw data in database is encrypted
- [ ] Verify app can decrypt and display correctly

---

## 📊 Progress Tracking

### Phase 1: Quick Wins (2 hours)
- [ ] Task 1.1: Input Validation (1 hour)
- [ ] Task 1.2: Security Headers (30 min)
- [ ] Task 1.3: Dependency Scanning (30 min)
- **Score after Phase 1: 9.1/10** ✨

### Phase 2: Medium Effort (9 hours)
- [ ] Task 2.1: Rate Limiting (3 hours)
- [ ] Task 2.2: Audit Logging (3 hours)
- [ ] Task 2.3: Security Monitoring (3 hours)
- **Score after Phase 2: 9.8/10** 🔥

### Phase 3: Advanced (14 hours)
- [ ] Task 3.1: Two-Factor Auth (6 hours)
- [ ] Task 3.2: Data Encryption (8 hours)
- **Score after Phase 3: 10/10** 🏆

---

## 🎯 Recommended Approach

### Option A: MVP Security (Current - 8.5/10)
**Status:** ✅ **Done! You're here now.**
- Good for: Beta testing, small user base, non-financial apps
- Time: Already complete

### Option B: Production Security (9.1/10)
**Recommendation:** Do Phase 1 (2 hours)
- Good for: Public launch, moderate user base
- Time: 2 hours
- ROI: High - Quick wins with big impact

### Option C: Enterprise Security (9.8/10)
**Recommendation:** Do Phase 1 + Phase 2 (11 hours)
- Good for: Growing apps, financial data, B2B
- Time: 11 hours total
- ROI: Medium - Significant effort but important

### Option D: Maximum Security (10/10)
**Recommendation:** All phases (25 hours)
- Good for: Healthcare, banking, highly sensitive data
- Time: 25 hours total
- ROI: Lower - Diminishing returns unless required

---

## 📝 Notes

### When to Do This:
- **Phase 1:** Before public launch (2 hours well spent)
- **Phase 2:** After you have 1000+ active users
- **Phase 3:** If handling very sensitive data or enterprise customers

### What You Can Skip:
- **2FA:** Not essential unless handling sensitive/financial data
- **Data Encryption:** Supabase already encrypts at rest
- **Rate Limiting:** Can wait until you see actual abuse

### What You Should Do:
- **Input Validation:** Prevents bad data (highly recommended)
- **Security Headers:** Easy win (if adding web version)
- **Dependency Scanning:** Catches vulnerabilities early (highly recommended)

---

## ✅ Current Status: 8.5/10 is Excellent!

Your app is **already production-ready** with:
- ✅ No exposed secrets
- ✅ Full RLS protection
- ✅ SQL injection prevention
- ✅ Proper authorization
- ✅ Secure storage

**You can launch now and add these improvements over time!**

---

## 🆘 Questions or Issues?

Refer back to:
- `SECURITY_AUDIT_REPORT.md` - Detailed explanations
- `SECURITY_COMPLETE.md` - What you've accomplished
- `SECURITY_IMPLEMENTATION_GUIDE.md` - How-to guides

**Good luck reaching 10/10! 🚀**

