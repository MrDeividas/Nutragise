-- Fix join failures: completeChallengeJoin writes payment_capture_method = 'wallet'
-- but the check constraint only allowed hold | wallet_escrow | free | immediate.
ALTER TABLE public.challenge_participants
  DROP CONSTRAINT IF EXISTS challenge_participants_payment_capture_method_check;

ALTER TABLE public.challenge_participants
  ADD CONSTRAINT challenge_participants_payment_capture_method_check
  CHECK (
    payment_capture_method = ANY (
      ARRAY[
        'hold'::text,
        'wallet_escrow'::text,
        'wallet'::text,
        'free'::text,
        'immediate'::text
      ]
    )
  );

COMMENT ON COLUMN public.challenge_participants.payment_capture_method IS
  'Join payment mode: free | wallet | wallet_escrow | hold(legacy) | immediate(legacy). New paid joins use wallet.';
