-- Account bans (temporary or permanent)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ban_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS ban_reason text;

CREATE INDEX IF NOT EXISTS profiles_ban_expires_at_idx
  ON public.profiles (ban_expires_at)
  WHERE ban_expires_at IS NOT NULL;

DROP POLICY IF EXISTS profiles_admin_update_ban ON public.profiles;
CREATE POLICY profiles_admin_update_ban
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users a
      WHERE a.user_id = auth.uid() AND a.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users a
      WHERE a.user_id = auth.uid() AND a.is_active = true
    )
  );
