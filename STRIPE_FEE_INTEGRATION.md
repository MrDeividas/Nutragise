# Stripe Fee Integration - User Covers Fees

## Overview
Users now cover Stripe processing fees when paying with a card. Wallet payments have no fees.

## How It Works

### Fee Calculation

**UK Cards:**
- Percentage: 1.4%
- Fixed: £0.20
- Formula: `totalAmount = (originalAmount + £0.20) / (1 - 0.014)`

**Example:**
- Entry fee: £10.00
- Stripe fee: £0.34 (1.4% of £10.34 + £0.20)
- Total user pays: £10.34

### Payment Methods

#### 1. Wallet Payment (No Fee)
- User has sufficient wallet balance
- Deducts exact entry fee from wallet
- No Stripe fee applied
- Creates $0 Payment Intent for tracking only

#### 2. Card Payment (Fee Applied)
- User pays with card
- Stripe fee automatically calculated and added
- User pays: Entry fee + Stripe fee
- Funds held in Stripe escrow

## Implementation Details

### Fee Calculator

**File:** `lib/stripeFeeCalculator.ts`

```typescript
import { stripeFeeCalculator } from '../lib/stripeFeeCalculator';

// Calculate fee for £10 entry
const fee = stripeFeeCalculator.calculateFee(10, true);
// Returns: { originalAmount: 10, stripeFee: 0.34, totalAmount: 10.34 }

// Get breakdown for UI
const breakdown = stripeFeeCalculator.getFeeBreakdown(10, true);
// Returns: { baseAmount: "£10.00", feeAmount: "£0.34", totalAmount: "£10.34", feePercentage: "1.4% + £0.20" }
```

### Edge Function

**File:** `supabase/functions/create-challenge-payment/index.ts`

- Calculates Stripe fee when `includeStripeFee: true`
- Adds fee to Payment Intent amount
- Stores original amount and fee in metadata

### UI Updates

**File:** `screens/ChallengeDetailScreen.tsx`

- Shows fee breakdown before payment
- Displays total amount including fee
- Clear messaging: "Entry: £X + Fee: £Y = Total: £Z"

## Fee Breakdown Display

### Before Payment
```
Card payment total: £10.34
(Entry: £10.00 + Stripe fee: £0.34)
```

### After Payment
```
Success! £10.34 has been processed
(£10.00 entry + £0.34 fee)
```

## Refund Handling

### Wallet Payments
- Refunds exact entry fee (no fee to refund)
- Refunded to wallet balance

### Card Payments
- Refunds total amount paid (entry + fee)
- Refunded via Stripe to original card
- Stripe fee is also refunded (Stripe doesn't charge fee on refunds)

## Database Tracking

Payment Intent metadata includes:
- `originalAmount`: Entry fee before fee
- `stripeFee`: Fee amount
- `includeStripeFee`: Whether fee was applied

## Testing

### Test Wallet Payment
1. Add £10 to wallet
2. Join £10 challenge
3. Verify: £10 deducted (no fee)
4. Check: Payment Intent shows $0 (wallet payment)

### Test Card Payment
1. Join £10 challenge without wallet balance
2. Choose "Pay with Card"
3. Verify: Shows total £10.34 (entry + fee)
4. Pay with test card: `4242 4242 4242 4242`
5. Check: Payment Intent shows £10.34 in Stripe Dashboard

### Test Refund
1. Join challenge with card
2. Leave before challenge starts
3. Verify: Full amount refunded (entry + fee)

## Fee Rates

### Current Rates (UK)
- **UK Cards**: 1.4% + £0.20
- **International Cards**: 2.9% + £0.30

### Updating Rates

Edit `lib/stripeFeeCalculator.ts`:

```typescript
private readonly UK_CARD_PERCENTAGE = 0.014; // 1.4%
private readonly UK_CARD_FIXED = 0.20; // £0.20
```

## Important Notes

⚠️ **Wallet Payments**: No fees applied (user already paid fees when adding to wallet)

⚠️ **Card Payments**: Fees automatically calculated and added

⚠️ **Refunds**: Full amount refunded (Stripe doesn't charge fee on refunds)

⚠️ **Transparency**: Users see fee breakdown before payment

## Summary

✅ **Users cover Stripe fees** for card payments
✅ **Wallet payments have no fees** (fees already paid when adding funds)
✅ **Fee calculation automatic** - no manual work needed
✅ **Transparent pricing** - users see fee breakdown
✅ **Proper refunds** - full amount refunded including fees

The system now automatically calculates and adds Stripe fees to card payments, ensuring you don't absorb processing costs!

