-- Unlockable badge achievements (catalog lives in app; unlocks stored here)
CREATE TABLE IF NOT EXISTS public.user_achievement_unlocks (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS user_achievement_unlocks_user_id_idx
  ON public.user_achievement_unlocks (user_id);

CREATE INDEX IF NOT EXISTS user_achievement_unlocks_unlocked_at_idx
  ON public.user_achievement_unlocks (user_id, unlocked_at DESC);

ALTER TABLE public.user_achievement_unlocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own achievement unlocks" ON public.user_achievement_unlocks;
CREATE POLICY "Users can read own achievement unlocks"
  ON public.user_achievement_unlocks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow reading other users' unlocks for public profile display
DROP POLICY IF EXISTS "Authenticated can read all achievement unlocks" ON public.user_achievement_unlocks;
CREATE POLICY "Authenticated can read all achievement unlocks"
  ON public.user_achievement_unlocks
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own achievement unlocks" ON public.user_achievement_unlocks;
CREATE POLICY "Users can insert own achievement unlocks"
  ON public.user_achievement_unlocks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

REVOKE ALL ON TABLE public.user_achievement_unlocks FROM PUBLIC;
GRANT SELECT, INSERT ON TABLE public.user_achievement_unlocks TO authenticated;
GRANT ALL ON TABLE public.user_achievement_unlocks TO service_role;
