-- Flag schema for challenge submissions (was referenced in app but missing remotely)
ALTER TABLE public.challenge_submissions
  ADD COLUMN IF NOT EXISTS is_flagged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.challenge_submission_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.challenge_submissions(id) ON DELETE CASCADE,
  flagged_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT challenge_submission_flags_unique UNIQUE (submission_id, flagged_by)
);

CREATE INDEX IF NOT EXISTS challenge_submission_flags_submission_idx
  ON public.challenge_submission_flags (submission_id);
CREATE INDEX IF NOT EXISTS challenge_submission_flags_flagged_by_idx
  ON public.challenge_submission_flags (flagged_by);

ALTER TABLE public.challenge_submission_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS challenge_submission_flags_select ON public.challenge_submission_flags;
CREATE POLICY challenge_submission_flags_select
  ON public.challenge_submission_flags
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS challenge_submission_flags_insert_own ON public.challenge_submission_flags;
CREATE POLICY challenge_submission_flags_insert_own
  ON public.challenge_submission_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = flagged_by
    AND NOT EXISTS (
      SELECT 1 FROM public.challenge_submissions s
      WHERE s.id = submission_id AND s.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS challenge_submission_flags_delete_own ON public.challenge_submission_flags;
CREATE POLICY challenge_submission_flags_delete_own
  ON public.challenge_submission_flags
  FOR DELETE
  TO authenticated
  USING (auth.uid() = flagged_by);

CREATE OR REPLACE FUNCTION public.sync_challenge_submission_flag_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_id uuid;
  cnt integer;
BEGIN
  target_id := COALESCE(NEW.submission_id, OLD.submission_id);
  SELECT COUNT(*)::integer INTO cnt
  FROM public.challenge_submission_flags
  WHERE submission_id = target_id;

  UPDATE public.challenge_submissions
  SET flag_count = cnt,
      is_flagged = cnt > 0
  WHERE id = target_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_submission_flag_counts ON public.challenge_submission_flags;
CREATE TRIGGER trg_sync_submission_flag_counts
AFTER INSERT OR DELETE ON public.challenge_submission_flags
FOR EACH ROW
EXECUTE FUNCTION public.sync_challenge_submission_flag_counts();

-- Content report review status for admin queue
ALTER TABLE public.content_reports
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pending'
    CHECK (review_status IN ('pending', 'dismissed', 'actioned')),
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_notes text;

DROP POLICY IF EXISTS content_reports_admin_select ON public.content_reports;
CREATE POLICY content_reports_admin_select
  ON public.content_reports
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = reporter_id
    OR EXISTS (
      SELECT 1 FROM public.admin_users a
      WHERE a.user_id = auth.uid() AND a.is_active = true
    )
  );

DROP POLICY IF EXISTS content_reports_admin_update ON public.content_reports;
CREATE POLICY content_reports_admin_update
  ON public.content_reports
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

-- Clear the entire pending challenge review queue
UPDATE public.challenges
SET
  approval_status = 'approved',
  reviewed_at = NOW(),
  admin_notes = COALESCE(NULLIF(admin_notes, ''), 'Bulk cleared from admin review queue')
WHERE approval_status = 'pending';
