# Stripe Connect Escrow Implementation

## Overview
Challenge payments now use **Stripe Connect with escrow**. Funds are held by Stripe until challenges complete, then transferred to winners.

## What Changed

### Before (Database-Only)
- Money deducted from user wallet (database)
- Added to challenge pot (database)
- No Stripe involvement for challenge payments

### After (Stripe Connect Escrow)
- User pays via Stripe Payment Sheet
- Funds held in Stripe escrow
- Visible in Stripe Dashboard
- Automatic fraud protection
- Transferred to winners when challenge completes

## Database Changes

Run this migration:
```sql
-- See: supabase/add_stripe_payment_intent_to_participants.sql
ALTER TABLE challenge_participants
ADD COLUMN stripe_payment_intent_id TEXT;
```

## New Edge Functions

1. **`create-challenge-payment`** - Creates Payment Intent for challenge entry fee
2. **`refund-challenge-payment`** - Refunds payment when user leaves
3. **`transfer-challenge-winnings`** - Transfers winnings to winners

## New Service Methods

### `challengesService.initiateChallengeJoin()`
Creates Stripe Payment Intent and returns client secret for Payment Sheet.

```typescript
const { paymentIntentId, clientSecret, entryFee } = 
  await challengesService.initiateChallengeJoin(challengeId, userId);
```

### `challengesService.completeChallengeJoin()`
Completes the join after payment succeeds.

```typescript
await challengesService.completeChallengeJoin(
  challengeId, 
  userId, 
  paymentIntentId
);
```

### `stripeService.refundChallengePayment()`
Refunds a challenge payment via Stripe.

```typescript
await stripeService.refundChallengePayment(paymentIntentId, amount);
```

### `stripeService.transferChallengeWinnings()`
Transfers winnings to winners (currently adds to wallet, can be upgraded to direct bank transfer).

```typescript
await stripeService.transferChallengeWinnings(
  userId,
  amount,
  challengeId,
  paymentIntentIds
);
```

## Updated Flow

### Joining a Challenge

1. **UI calls `initiateChallengeJoin()`**
   - Creates Stripe Payment Intent
   - Returns `clientSecret` and `paymentIntentId`

2. **Show Stripe Payment Sheet**
   ```typescript
   const { error: initError } = await initPaymentSheet({
     merchantDisplayName: 'NutrApp',
     paymentIntentClientSecret: clientSecret,
   });
   
   const { error: presentError } = await presentPaymentSheet();
   ```

3. **On success, call `completeChallengeJoin()`**
   - Updates participant record with `paymentIntentId`
   - Funds now held in Stripe escrow

### Leaving a Challenge

1. **Get participant's `stripe_payment_intent_id`**
2. **Call `stripeService.refundChallengePayment()`**
3. **Delete participant record**

### Challenge Completion

1. **Call `challengePotService.distributePot()`**
2. **For each winner:**
   - Call `stripeService.transferChallengeWinnings()`
   - Currently adds to wallet (can upgrade to direct bank transfer)

## UI Updates Needed

### ChallengeDetailScreen.tsx

Update the `handleJoinChallenge` function:

```typescript
const handleJoinChallenge = async () => {
  if (!user || !challenge) return;
  
  const entryFee = challenge.entry_fee || 0;
  
  if (entryFee > 0) {
    try {
      // Step 1: Initiate join (creates Payment Intent)
      const { paymentIntentId, clientSecret, entryFee: fee } = 
        await challengesService.initiateChallengeJoin(challenge.id, user.id);
      
      // Step 2: Show Stripe Payment Sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'NutrApp',
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: { name: user.email?.split('@')[0] || 'User' },
      });
      
      if (initError) throw new Error(initError.message);
      
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code === 'Canceled') return;
        throw new Error(presentError.message);
      }
      
      // Step 3: Complete join (updates participant record)
      await challengesService.completeChallengeJoin(
        challenge.id,
        user.id,
        paymentIntentId
      );
      
      Alert.alert('Success!', `You've joined the challenge!`);
      await loadChallengeDetails();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  } else {
    // Free challenge - no payment needed
    const success = await challengesService.completeChallengeJoin(
      challenge.id,
      user.id,
      null
    );
    if (success) {
      Alert.alert('Success!', `You've joined the challenge!`);
      await loadChallengeDetails();
    }
  }
};
```

## Stripe Dashboard

You'll now see:
- ✅ Payment Intents for each challenge join
- ✅ Refunds when users leave
- ✅ All transactions in one place
- ✅ Fraud protection
- ✅ Chargeback handling

## Future Enhancements

### Stripe Connect Accounts
To transfer directly to user bank accounts:

1. Set up Stripe Connect
2. Create Connect accounts for users
3. Update `transfer-challenge-winnings` to use `stripe.transfers.create()`

### Platform Fees
Currently platform fees are tracked in database. To collect via Stripe:

1. Use `application_fee_amount` in Payment Intent
2. Automatically collected by Stripe
3. Visible in Stripe Dashboard

## Testing

1. **Test joining a paid challenge:**
   - Use Stripe test cards: `4242 4242 4242 4242`
   - Verify Payment Intent appears in Stripe Dashboard

2. **Test leaving a challenge:**
   - Join a challenge
   - Leave before it starts
   - Verify refund appears in Stripe Dashboard

3. **Test challenge completion:**
   - Complete a challenge
   - Verify winnings transferred (check wallet balance)

## Environment Variables

Ensure these are set in Supabase:
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - For webhook verification

## Migration Checklist

- [ ] Run database migration: `add_stripe_payment_intent_to_participants.sql`
- [ ] Deploy Edge Functions:
  - [ ] `create-challenge-payment`
  - [ ] `refund-challenge-payment`
  - [ ] `transfer-challenge-winnings`
- [ ] Update `ChallengeDetailScreen.tsx` to use new flow
- [ ] Test joining a challenge
- [ ] Test leaving a challenge
- [ ] Test challenge completion
- [ ] Verify transactions in Stripe Dashboard

