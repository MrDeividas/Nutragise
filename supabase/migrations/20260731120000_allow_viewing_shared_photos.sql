-- Let challenge participants see each other's proof submissions
CREATE POLICY "Participants can view challenge submissions"
ON public.challenge_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.challenge_participants cp
    WHERE cp.challenge_id = challenge_submissions.challenge_id
      AND cp.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.challenges c
    WHERE c.id = challenge_submissions.challenge_id
      AND c.created_by = auth.uid()
  )
);

-- Public read for shared photo folders in the users bucket
-- (profiles already covered by "Anyone can view profile pictures")
CREATE POLICY "Anyone can view shared user photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'users'
  AND (
    name LIKE '%/posts/%'
    OR name LIKE '%/challenge-proofs/%'
    OR name LIKE '%/goal_%'
    OR name LIKE '%/achievements/%'
  )
);
