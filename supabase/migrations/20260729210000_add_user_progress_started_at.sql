-- Track when a user first starts a microlearn (for free-tier daily limits + continue access)
ALTER TABLE public.user_progress
ADD COLUMN IF NOT EXISTS started_at timestamptz;

UPDATE public.user_progress
SET started_at = COALESCE(completed_at, created_at)
WHERE started_at IS NULL;

COMMENT ON COLUMN public.user_progress.started_at IS
  'When the user first started this microlearn. Free users may start 1 new item per app-day; started items can always be continued.';
