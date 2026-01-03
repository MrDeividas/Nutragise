-- Add new columns for user-created challenges
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS visibility TEXT CHECK (visibility IN ('public', 'private')) DEFAULT 'public',
ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS is_user_created BOOLEAN DEFAULT false;

-- Create index for join code lookups
CREATE INDEX IF NOT EXISTS idx_challenges_join_code ON challenges(join_code) WHERE join_code IS NOT NULL;

-- Allow PRO users to create challenges
CREATE POLICY "Pro users can create challenges" ON challenges
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND is_pro = true
    )
    AND is_user_created = true
  );

-- Allow creators to update their own challenges
CREATE POLICY "Users can update their own challenges" ON challenges
  FOR UPDATE
  USING (created_by = auth.uid() AND is_user_created = true);

-- Allow creators to delete their own challenges
CREATE POLICY "Users can delete their own challenges" ON challenges
  FOR DELETE
  USING (created_by = auth.uid() AND is_user_created = true);

