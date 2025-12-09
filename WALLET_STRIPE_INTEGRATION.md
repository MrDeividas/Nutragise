# Wallet + Stripe Integration for Challenge Payments

## Overview
Challenge payments now support **both wallet balance and card payments**, with all funds tracked via Stripe for escrow and compliance.

## How It Works

### Payment Flow

1. **User clicks "Join Challenge"**
   - System checks wallet balance
   
2. **If wallet has sufficient funds:**
   - ✅ Deducts from wallet balance
   - ✅ Creates Stripe Payment Intent ($0 amount) for tracking
   - ✅ Marks Payment Intent as paid (via metadata)
   - ✅ Funds held in database (wallet deduction)
   - ✅ Tracked in Stripe Dashboard for compliance

3. **If wallet has insufficient funds:**
   - ✅ Shows payment options:
     - Add funds to wallet first
     - Pay directly with card
   - ✅ If user chooses card: Creates real Stripe Payment Intent
   - ✅ User pays via Stripe Payment Sheet
   - ✅ Funds held in Stripe escrow

### Refund Flow

1. **User leaves challenge (before it starts)**
   - System checks payment method
   
2. **If paid from wallet:**
   - ✅ Refunds to wallet balance
   - ✅ Updates Stripe Payment Intent (for tracking)
   
3. **If paid with card:**
   - ✅ Refunds via Stripe
   - ✅ Money returned to user's card

### Distribution Flow

1. **Challenge completes**
   - System calculates winnings
   - For wallet-paid challenges: Uses wallet balance
   - For card-paid challenges: Transfers from Stripe
   - Winners receive funds in their wallet

## Key Features

✅ **Wallet Integration**: Users can use wallet balance to join challenges
✅ **Stripe Escrow**: All payments tracked via Stripe for compliance
✅ **Flexible Payment**: Wallet OR card payment options
✅ **Proper Refunds**: Refunds go back to original payment method
✅ **Stripe Dashboard**: All transactions visible in Stripe

## Database Changes

No new fields needed - we use existing:
- `challenge_participants.stripe_payment_intent_id` - Tracks Payment Intent
- Payment Intent metadata includes `paidFromWallet` flag

## Code Changes

### New Methods

1. **`challengesService.initiateChallengeJoinWithWallet()`**
   - Deducts from wallet
   - Creates $0 Payment Intent for tracking

2. **`stripeService.createChallengePaymentIntentWithWallet()`**
   - Creates Payment Intent with `paidFromWallet=true` flag

### Updated Methods

1. **`ChallengeDetailScreen.handleJoinChallenge()`**
   - Checks wallet balance first
   - Uses wallet if sufficient
   - Shows card payment option if insufficient

2. **`challengesService.leaveChallenge()`**
   - Detects payment method
   - Refunds to wallet or Stripe accordingly

## Testing

### Test Wallet Payment
1. Add funds to wallet
2. Join challenge with entry fee
3. Verify wallet balance deducted
4. Check Stripe Dashboard for $0 Payment Intent (tracking)

### Test Card Payment
1. Join challenge without sufficient wallet balance
2. Choose "Pay with Card"
3. Use test card: `4242 4242 4242 4242`
4. Verify Payment Intent in Stripe Dashboard

### Test Refund
1. Join challenge (wallet or card)
2. Leave before challenge starts
3. Verify refund to correct method:
   - Wallet payment → Wallet balance increased
   - Card payment → Refund in Stripe Dashboard

## Important Notes

⚠️ **Escrow**: 
- Wallet payments: Funds held in database (wallet deduction)
- Card payments: Funds held in Stripe escrow
- Both tracked via Stripe Payment Intents for compliance

⚠️ **Stripe Dashboard**:
- Wallet payments show as $0 Payment Intents (for tracking)
- Card payments show as full Payment Intents
- All transactions visible for compliance

⚠️ **Refunds**:
- Automatically detect payment method
- Refund to correct source (wallet or card)

## Summary

✅ **Wallet integration maintained** - Users can use wallet balance
✅ **Stripe escrow for compliance** - All payments tracked
✅ **Flexible payment options** - Wallet OR card
✅ **Proper refund handling** - Refunds to correct source
✅ **No breaking changes** - Existing wallet functionality preserved

The system now supports both wallet and card payments while maintaining Stripe escrow for compliance and fraud protection!

