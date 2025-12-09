-- Enable RLS on challenge_requirements if not already enabled
ALTER TABLE challenge_requirements ENABLE ROW LEVEL SECURITY;

-- Allow all users to read challenge requirements
CREATE POLICY "Allow public read access for challenge requirements" 
ON challenge_requirements FOR SELECT 
USING (true);

-- Allow authenticated users to insert requirements (needed for creating challenges)
CREATE POLICY "Allow authenticated users to insert challenge requirements" 
ON challenge_requirements FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow creators to update their own challenge requirements
-- Assuming challenge_requirements has a challenge_id that links to challenges table
CREATE POLICY "Allow challenge creators to update requirements" 
ON challenge_requirements FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM challenges 
    WHERE challenges.id = challenge_requirements.challenge_id 
    AND challenges.created_by = auth.uid()
  )
);

-- Allow creators to delete their own challenge requirements
CREATE POLICY "Allow challenge creators to delete requirements" 
ON challenge_requirements FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM challenges 
    WHERE challenges.id = challenge_requirements.challenge_id 
    AND challenges.created_by = auth.uid()
  )
);

