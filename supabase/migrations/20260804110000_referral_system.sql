-- Own shareable referral codes + referral attribution log

-- Helper: generate a short unique code (e.g. NUT7K2M9)
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text;
  i int;
BEGIN
  LOOP
    result := 'NUT';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE referral_code = result
    );
  END LOOP;
  RETURN result;
END;
$$;

-- referred_by: who invited this user
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Unique shareable code per user
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_unique
  ON public.profiles (referral_code)
  WHERE referral_code IS NOT NULL;

-- Auto-assign code on insert / when missing
CREATE OR REPLACE FUNCTION public.profiles_ensure_referral_code()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.referral_code IS NULL OR btrim(NEW.referral_code) = '' THEN
    NEW.referral_code := public.generate_referral_code();
  ELSE
    NEW.referral_code := upper(btrim(NEW.referral_code));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_ensure_referral_code ON public.profiles;
CREATE TRIGGER trg_profiles_ensure_referral_code
  BEFORE INSERT OR UPDATE OF referral_code ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_ensure_referral_code();

-- Prevent users from changing their code or forging referred_by via direct update
CREATE OR REPLACE FUNCTION public.profiles_lock_referral_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.referral_code IS NOT NULL AND NEW.referral_code IS DISTINCT FROM OLD.referral_code THEN
      NEW.referral_code := OLD.referral_code;
    END IF;
    -- referred_by only via apply_referral_code (sets app.allow_referral_apply)
    IF NEW.referred_by IS DISTINCT FROM OLD.referred_by THEN
      IF current_setting('app.allow_referral_apply', true) IS DISTINCT FROM 'on' THEN
        NEW.referred_by := OLD.referred_by;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_lock_referral_fields ON public.profiles;
CREATE TRIGGER trg_profiles_lock_referral_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_lock_referral_fields();

-- Backfill existing users
UPDATE public.profiles
SET referral_code = public.generate_referral_code()
WHERE referral_code IS NULL OR btrim(referral_code) = '';

-- Referral event log
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT referrals_no_self CHECK (referrer_id <> referred_id),
  CONSTRAINT referrals_referred_unique UNIQUE (referred_id)
);

CREATE INDEX IF NOT EXISTS referrals_referrer_id_idx ON public.referrals (referrer_id);
CREATE INDEX IF NOT EXISTS referrals_created_at_idx ON public.referrals (created_at DESC);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referrals_select_own ON public.referrals;
CREATE POLICY referrals_select_own ON public.referrals
  FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Apply a friend's code during onboarding (one-time)
CREATE OR REPLACE FUNCTION public.apply_referral_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_referrer public.profiles%ROWTYPE;
  v_me public.profiles%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF v_code = '' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'empty_code');
  END IF;

  SELECT * INTO v_me FROM public.profiles WHERE id = v_uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'profile_missing');
  END IF;

  IF v_me.referred_by IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_referred', 'referrer_id', v_me.referred_by);
  END IF;

  SELECT * INTO v_referrer
  FROM public.profiles
  WHERE referral_code = v_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_code');
  END IF;

  IF v_referrer.id = v_uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'self_referral');
  END IF;

  PERFORM set_config('app.allow_referral_apply', 'on', true);

  UPDATE public.profiles
  SET referred_by = v_referrer.id,
      updated_at = now()
  WHERE id = v_uid
    AND referred_by IS NULL;

  INSERT INTO public.referrals (referrer_id, referred_id, referral_code)
  VALUES (v_referrer.id, v_uid, v_code)
  ON CONFLICT (referred_id) DO NOTHING;

  RETURN jsonb_build_object(
    'ok', true,
    'referrer_id', v_referrer.id,
    'referrer_username', v_referrer.username,
    'referrer_display_name', v_referrer.display_name,
    'referral_code', v_code
  );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_referral_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_referral_code(text) TO authenticated;
