-- Safe RLS tighten: clients can't forge system writes; service_role still bypasses RLS.

-- ========== challenge_pots ==========
DROP POLICY IF EXISTS "System can manage challenge pots" ON public.challenge_pots;

CREATE POLICY "Authenticated can create empty collecting pots"
  ON public.challenge_pots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    COALESCE(total_amount, 0) = 0
    AND COALESCE(platform_fee_amount, 0) = 0
    AND COALESCE(winners_pot, 0) = 0
    AND COALESCE(status, 'collecting') = 'collecting'
    AND distributed_at IS NULL
    AND EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id)
  );

CREATE POLICY "Participants creators or admins can update pots"
  ON public.challenge_pots
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.challenge_id = challenge_pots.challenge_id
        AND cp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_pots.challenge_id
        AND c.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.admin_users a
      WHERE a.user_id = auth.uid() AND a.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenge_participants cp
      WHERE cp.challenge_id = challenge_pots.challenge_id
        AND cp.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_pots.challenge_id
        AND c.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.admin_users a
      WHERE a.user_id = auth.uid() AND a.is_active = true
    )
  );

CREATE OR REPLACE FUNCTION public.protect_challenge_pot_writes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin boolean;
  entry numeric;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.admin_users a
    WHERE a.user_id = auth.uid() AND a.is_active = true
  ) INTO is_admin;

  IF is_admin THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.total_amount, 0) <> 0
       OR COALESCE(NEW.platform_fee_amount, 0) <> 0
       OR COALESCE(NEW.winners_pot, 0) <> 0
       OR COALESCE(NEW.status, 'collecting') <> 'collecting'
       OR NEW.distributed_at IS NOT NULL THEN
      RAISE EXCEPTION 'challenge_pots insert must start empty and collecting';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.challenge_id IS DISTINCT FROM OLD.challenge_id THEN
    RAISE EXCEPTION 'challenge_pots.challenge_id is immutable';
  END IF;

  IF NEW.total_amount IS DISTINCT FROM OLD.total_amount
     AND COALESCE(OLD.status, 'collecting') = 'collecting'
     AND NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.distributed_at IS NOT DISTINCT FROM OLD.distributed_at
     AND NEW.platform_fee_amount IS NOT DISTINCT FROM OLD.platform_fee_amount
     AND NEW.winners_pot IS NOT DISTINCT FROM OLD.winners_pot
     AND NEW.platform_fee_percentage IS NOT DISTINCT FROM OLD.platform_fee_percentage THEN
    SELECT COALESCE(c.entry_fee, 0) INTO entry
    FROM public.challenges c
    WHERE c.id = NEW.challenge_id;

    IF ABS(NEW.total_amount - OLD.total_amount) <> entry THEN
      RAISE EXCEPTION 'challenge_pots total_amount change must equal challenge entry_fee';
    END IF;
    IF NEW.total_amount < 0 THEN
      RAISE EXCEPTION 'challenge_pots total_amount cannot be negative';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.distributed_at IS DISTINCT FROM OLD.distributed_at
     OR NEW.platform_fee_amount IS DISTINCT FROM OLD.platform_fee_amount
     OR NEW.winners_pot IS DISTINCT FROM OLD.winners_pot
     OR NEW.platform_fee_percentage IS DISTINCT FROM OLD.platform_fee_percentage THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = NEW.challenge_id
        AND c.end_date < now()
    ) THEN
      RAISE EXCEPTION 'challenge_pots can only be finalized after challenge end_date';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_challenge_pot_writes ON public.challenge_pots;
CREATE TRIGGER trg_protect_challenge_pot_writes
  BEFORE INSERT OR UPDATE ON public.challenge_pots
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_challenge_pot_writes();

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.challenge_pots FROM anon;

-- ========== challenge_requirements ==========
DROP POLICY IF EXISTS "Allow authenticated users to insert challenge requirements" ON public.challenge_requirements;

CREATE POLICY "Creators admins or recurring can insert requirements"
  ON public.challenge_requirements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.challenges c
      WHERE c.id = challenge_id
        AND (
          c.created_by = auth.uid()
          OR COALESCE(c.is_recurring, false) = true
          OR EXISTS (
            SELECT 1 FROM public.admin_users a
            WHERE a.user_id = auth.uid() AND a.is_active = true
          )
        )
    )
  );

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.challenge_requirements FROM anon;

-- ========== information (read-only for clients; CMS via service_role) ==========
DROP POLICY IF EXISTS "Enable all operations" ON public.information;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.information;
DROP POLICY IF EXISTS "Allow authenticated users to insert information" ON public.information;
DROP POLICY IF EXISTS "Allow authenticated users to update information" ON public.information;
DROP POLICY IF EXISTS "Allow authenticated users to delete information" ON public.information;

DROP POLICY IF EXISTS "Allow authenticated users to read information" ON public.information;
CREATE POLICY "Authenticated can read information"
  ON public.information
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.information FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.information FROM authenticated;
GRANT SELECT ON public.information TO authenticated;

-- ========== questions (read-only for clients) ==========
DROP POLICY IF EXISTS "Enable all operations" ON public.questions;
DROP POLICY IF EXISTS "Allow authenticated users to insert questions" ON public.questions;
DROP POLICY IF EXISTS "Allow authenticated users to update questions" ON public.questions;
DROP POLICY IF EXISTS "Allow authenticated users to delete questions" ON public.questions;

DROP POLICY IF EXISTS "Allow authenticated users to read questions" ON public.questions;
CREATE POLICY "Authenticated can read questions"
  ON public.questions
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.questions FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.questions FROM authenticated;
GRANT SELECT ON public.questions TO authenticated;

-- ========== notifications ==========
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Users can insert notifications as self or sender"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      auth.uid() = user_id
      OR auth.uid() = from_user_id
    )
  );

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.notifications FROM anon;

-- ========== unread_counts ==========
DROP POLICY IF EXISTS "Users can manage their unread counts" ON public.unread_counts;

CREATE POLICY "Users can insert their own unread counts"
  ON public.unread_counts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.unread_counts FROM anon;

-- Trigger helper is not an RPC
REVOKE ALL ON FUNCTION public.protect_challenge_pot_writes() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.protect_challenge_pot_writes() FROM anon;
REVOKE ALL ON FUNCTION public.protect_challenge_pot_writes() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.protect_challenge_pot_writes() TO postgres, service_role;
