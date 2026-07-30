-- Deprecate Stripe hold-escrow join path. New joins use wallet debit only
-- (payment_capture_method = 'wallet'). Hold columns retained for any legacy rows.

COMMENT ON COLUMN public.challenge_participants.payment_capture_method IS
  'Join payment mode: free | wallet | hold(legacy). New paid joins use wallet only.';

COMMENT ON COLUMN public.challenge_participants.stripe_setup_intent_id IS
  'Legacy hold SetupIntent id. Unused for new wallet joins.';

COMMENT ON COLUMN public.challenge_participants.stripe_payment_method_id IS
  'Legacy hold payment method id. Unused for new wallet joins.';

COMMENT ON COLUMN public.challenge_participants.payment_authorized_at IS
  'Legacy hold authorization timestamp. Unused for new wallet joins.';

-- Mark unpaid legacy hold rows as needing wallet payment (do not auto-debit).
-- Keep payment_capture_method = hold so settle cron can still process if a PI exists.
-- No data mutation beyond comments for safety.
