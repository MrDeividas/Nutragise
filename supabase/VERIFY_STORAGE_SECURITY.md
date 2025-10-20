# 🗂️ Storage Bucket Security Verification Guide

**Quick guide to verify your Supabase Storage is secure**

---

## 📋 What To Check

Your app stores user photos in the `users` bucket. We need to ensure users can only access their own files.

---

## 🔍 Step 1: Check Current Policies

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **Storage** in the left sidebar
4. Click on the **`users`** bucket
5. Click the **Policies** tab

---

## ⚠️ What You Should See

### **Good Security (What You Want):**

You should have policies like:

**Policy 1: Users can view their own files**
```sql
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'users' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 2: Users can upload their own files**
```sql
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'users'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 3: Users can update their own files**
```sql
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'users'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**Policy 4: Users can delete their own files**
```sql
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'users'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### **What This Does:**
- Files are organized by user ID: `users/{user_id}/file.jpg`
- The `(storage.foldername(name))[1]` extracts the user_id from the path
- `auth.uid()` is the current authenticated user
- Policy ensures: `auth.uid() = user_id` in the path

---

## 🚨 Bad Security (What To Avoid):

### ❌ **DON'T HAVE THIS:**
```sql
-- BAD: Anyone can access any file!
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'users');
```

### ❌ **OR THIS:**
```sql
-- BAD: Anyone authenticated can do anything!
CREATE POLICY "Authenticated users"
ON storage.objects FOR ALL
USING (auth.role() = 'authenticated');
```

---

## 🔧 How To Fix If Needed

If you don't have the correct policies:

### **Step 1: Delete Bad Policies**
1. In Storage → Policies
2. Click the **⋮** menu next to each policy
3. Click **Delete**

### **Step 2: Add Good Policies**

Click **"New Policy"** and add each of these:

**For SELECT (View):**
- Name: `Users can view own files`
- Allowed operation: `SELECT`
- Policy definition:
```sql
bucket_id = 'users' 
AND auth.uid()::text = (storage.foldername(name))[1]
```

**For INSERT (Upload):**
- Name: `Users can upload own files`
- Allowed operation: `INSERT`
- WITH CHECK:
```sql
bucket_id = 'users'
AND auth.uid()::text = (storage.foldername(name))[1]
```

**For UPDATE:**
- Name: `Users can update own files`
- Allowed operation: `UPDATE`
- Policy definition:
```sql
bucket_id = 'users'
AND auth.uid()::text = (storage.foldername(name))[1]
```

**For DELETE:**
- Name: `Users can delete own files`
- Allowed operation: `DELETE`
- Policy definition:
```sql
bucket_id = 'users'
AND auth.uid()::text = (storage.foldername(name))[1]
```

---

## 🧪 Test Your Storage Security

After setting policies, test:

### **Test 1: Upload Your Own Photo**
- Should work ✅

### **Test 2: Try to Access Another User's Photo**
Try to download a file with someone else's user_id:
```typescript
const { data, error } = await supabase.storage
  .from('users')
  .download('other-user-id/their-photo.jpg');
// Should get 403 Forbidden ✅
```

### **Test 3: Try to Delete Another User's Photo**
```typescript
const { error } = await supabase.storage
  .from('users')
  .remove(['other-user-id/their-photo.jpg']);
// Should fail ✅
```

---

## ✅ Verification Checklist

After checking:

- [ ] Storage bucket has RLS enabled
- [ ] Have SELECT policy checking user_id
- [ ] Have INSERT policy checking user_id
- [ ] Have UPDATE policy checking user_id
- [ ] Have DELETE policy checking user_id
- [ ] Tested: Can upload own photos
- [ ] Tested: Cannot access others' photos

---

## 📊 Current Status

**If you have the correct policies:** ✅ Storage is secure!  
**If not:** Follow the fix steps above

---

## 💡 Notes

- Your app stores files in: `users/{user_id}/goal_{goal_id}_progress/photo.jpg`
- The policies check that `user_id` in the path matches the authenticated user
- This prevents users from accessing each other's photos

---

**Questions?** Check the Supabase Storage Security docs or let me know if you see any issues!

