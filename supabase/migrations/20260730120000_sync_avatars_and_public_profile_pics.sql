-- Backfill profiles.avatar_url from users when missing (community feed reads profiles)
UPDATE public.profiles p
SET avatar_url = u.avatar_url
FROM public.users u
WHERE p.id = u.id
  AND (p.avatar_url IS NULL OR btrim(p.avatar_url) = '')
  AND u.avatar_url IS NOT NULL
  AND btrim(u.avatar_url) <> '';

-- Allow anyone to read profile pictures stored under {userId}/profile/...
DROP POLICY IF EXISTS "Anyone can view profile pictures" ON storage.objects;
CREATE POLICY "Anyone can view profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'users'
  AND name LIKE '%/profile/%'
);
