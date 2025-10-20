# Onboarding Setup Instructions

## Database Migration Required

The onboarding flow requires new columns in the `profiles` table. You need to run the SQL migration in your Supabase dashboard.

### Steps:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project
   - Navigate to "SQL Editor" in the left sidebar

2. **Run the Migration**
   - Click "New Query"
   - Copy and paste the contents of `supabase/add_onboarding_fields.sql`
   - Click "Run" to execute the SQL

### SQL to Run:

```sql
-- Add onboarding fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS life_description TEXT,
ADD COLUMN IF NOT EXISTS change_reason TEXT,
ADD COLUMN IF NOT EXISTS proud_moment TEXT,
ADD COLUMN IF NOT EXISTS morning_motivation TEXT,
ADD COLUMN IF NOT EXISTS current_state TEXT,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS auth_method TEXT;

COMMENT ON COLUMN profiles.referral_code IS 'Referral code used during sign up';
COMMENT ON COLUMN profiles.date_of_birth IS 'User date of birth';
COMMENT ON COLUMN profiles.life_description IS 'How user describes their current life (onboarding Q3)';
COMMENT ON COLUMN profiles.change_reason IS 'Why user wants to make a change (onboarding Q4)';
COMMENT ON COLUMN profiles.proud_moment IS 'Last time user felt proud (onboarding Q5)';
COMMENT ON COLUMN profiles.morning_motivation IS 'What gets user out of bed (onboarding Q6)';
COMMENT ON COLUMN profiles.current_state IS 'Word that describes user right now (onboarding Q7)';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed onboarding flow';
COMMENT ON COLUMN profiles.is_premium IS 'Whether user has premium subscription';
COMMENT ON COLUMN profiles.auth_method IS 'Sign up method: google, apple, or email';
```

3. **Verify the Migration**
   - After running, go to "Table Editor" → "profiles"
   - Check that the new columns appear in the schema
   - They should all be there with the correct data types

## Troubleshooting

### Error: "column does not exist"
- This means the SQL migration hasn't been run yet
- Follow steps 1-3 above to add the columns

### Error: "permission denied"
- Make sure you're logged into the correct Supabase project
- Check that your RLS policies allow updates to the profiles table

### Error: "no user found"
- This means the auth session isn't established
- Make sure you're signing up with a valid email/password
- Check the browser console for any auth errors

## After Migration

Once the migration is complete:
1. Try signing up again with a new account
2. Complete the onboarding questionnaire
3. The data should save successfully
4. You'll be redirected to the main app

## Check Logs

If you still see errors, check the terminal output for:
- `💾 Saving onboarding data for user: [user-id]`
- `📊 Data to save: { ... }`
- `❌ Error updating profile: { ... }` (if there's an error)
- `✅ Profile updated successfully` (if it works)

The error details will help diagnose the issue.

