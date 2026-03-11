-- Phase 1: Add hold-based payment columns to challenge_participants
-- This supports the SetupIntent → authorize at start → capture/cancel at end flow

ALTER TABLE challenge_participants
  ADD COLUMN IF NOT EXISTS payment_capture_method TEXT
    CHECK (payment_capture_method IN ('hold', 'wallet_escrow', 'free', 'immediate'))
    DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS stripe_setup_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_authorized_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_settled BOOLEAN DEFAULT false;

-- Index for finding participants that need authorization at challenge start
CREATE INDEX IF NOT EXISTS idx_participants_needs_auth
  ON challenge_participants (challenge_id, payment_capture_method, payment_settled)
  WHERE payment_capture_method = 'hold'
    AND stripe_payment_method_id IS NOT NULL
    AND stripe_payment_intent_id IS NULL
    AND payment_settled = false;

-- Index for finding participants that need settlement at challenge end
CREATE INDEX IF NOT EXISTS idx_participants_needs_settlement
  ON challenge_participants (challenge_id, payment_capture_method, payment_settled)
  WHERE payment_capture_method = 'hold'
    AND stripe_payment_intent_id IS NOT NULL
    AND payment_settled = false;

-- Allow users to read their own participant records (for payment status)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'challenge_participants'
      AND policyname = 'Users can view own participant record'
  ) THEN
    CREATE POLICY "Users can view own participant record"
      ON challenge_participants FOR SELECT
      USING (user_id = auth.uid());
  END IF;
END $$;
