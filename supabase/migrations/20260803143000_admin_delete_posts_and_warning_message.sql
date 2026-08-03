-- Allow admins to delete reported community posts
DROP POLICY IF EXISTS posts_admin_delete ON public.posts;
CREATE POLICY posts_admin_delete
  ON public.posts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users a
      WHERE a.user_id = auth.uid() AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS daily_posts_admin_delete ON public.daily_posts;
CREATE POLICY daily_posts_admin_delete
  ON public.daily_posts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users a
      WHERE a.user_id = auth.uid() AND a.is_active = true
    )
  );

-- Optional message body for admin warnings / richer notifications
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS message text;
