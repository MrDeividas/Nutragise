-- Add Stripe payment intent ID to challenge_participants table
-- This tracks which Stripe Payment Intent was used for each participant's entry fee
-- Funds are held in Stripe escrow until challenge completes

ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_challenge_participants_stripe_payment_intent 
ON challenge_participants(stripe_payment_intent_id);

COMMENT ON COLUMN challenge_participants.stripe_payment_intent_id IS 
'Stripe Payment Intent ID for challenge entry fee. Funds held in Stripe escrow.';
