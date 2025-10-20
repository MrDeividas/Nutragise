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

