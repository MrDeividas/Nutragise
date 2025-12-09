# Stripe Test Mode & Platform Fee Implementation Summary

## 📋 Current Status

### ✅ What's Done
- Stripe test keys configured in `.env`
- Stripe packages installed (`@stripe/stripe-react-native`)
- Wallet system implemented
- Platform fee calculation (30% default)

### ❌ What's Missing
1. **Real Stripe Integration**: Currently using demo mode
2. **Platform Fee Collection**: Fees are calculated but not collected anywhere

---

## 🔧 Implementation Steps

### Part 1: Real Stripe Test Mode

#### Option A: Supabase Edge Functions (Recommended)

**Step 1: Create Edge Functions**

You need to create two Supabase Edge Functions:

1. **`create-payment-intent`** - Creates Stripe payment intent
2. **`stripe-webhook`** - Handles Stripe webhook events

**Files to create:**
- `supabase/functions/create-payment-intent/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

**Step 2: Deploy Functions**

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Initialize (if not already done)
supabase init

# Create functions
supabase functions new create-payment-intent
supabase functions new stripe-webhook

# Deploy
supabase functions deploy create-payment-intent
supabase functions deploy stripe-webhook
```

**Step 3: Set Environment Variables in Supabase**

In Supabase Dashboard → Project Settings → Edge Functions:
- `STRIPE_SECRET_KEY` = your `sk_test_...` key
- `STRIPE_WEBHOOK_SECRET` = your webhook secret
- `SUPABASE_URL` = your Supabase URL
- `SUPABASE_SERVICE_ROLE_KEY` = your service role key

**Step 4: Configure Stripe Webhook**

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
3. Select event: `payment_intent.succeeded`
4. Copy webhook signing secret to Supabase environment variables

**Step 5: Update WalletScreen**

Replace demo implementation with real Stripe React Native:

```typescript
import { useStripe } from '@stripe/stripe-react-native';

// In WalletScreen component
const { initPaymentSheet, presentPaymentSheet } = useStripe();

// When user clicks "Add Funds"
const handleAddFunds = async (amount: number) => {
  // 1. Create payment intent via Edge Function
  const { clientSecret, paymentIntentId } = await stripeService.createPaymentIntent(
    amount,
    user.id,
    { userId: user.id, purpose: 'wallet_deposit' }
  );

  // 2. Initialize payment sheet
  const { error: initError } = await initPaymentSheet({
    paymentIntentClientSecret: clientSecret,
    merchantDisplayName: 'Nutrapp',
  });

  if (initError) {
    Alert.alert('Error', initError.message);
    return;
  }

  // 3. Present payment sheet
  const { error: presentError } = await presentPaymentSheet();

  if (presentError) {
    Alert.alert('Error', presentError.message);
    return;
  }

  // 4. Payment succeeded - webhook will update wallet
  // Reload wallet data
  await loadWalletData();
};
```

#### Option B: Separate Backend API

If you prefer a separate backend:
- Create Express.js server
- Implement `/api/stripe/create-payment-intent` endpoint
- Implement `/api/webhooks/stripe` endpoint
- Update `stripeService.ts` to call your backend URL

---

### Part 2: Platform Fee Collection

**Current Problem:**
Platform fees are calculated (30% of pot) but **NOT collected anywhere**. They're just deducted from winners pot.

**Solution:**

#### Step 1: Create Platform Wallet Function

Add to `lib/walletService.ts`:

```typescript
/**
 * Get or create platform wallet (for collecting fees)
 */
async getPlatformWallet(): Promise<UserWallet> {
  const PLATFORM_USER_ID = '00000000-0000-0000-0000-000000000000'; // Or use a real admin user ID
  return await this.getWallet(PLATFORM_USER_ID);
}

/**
 * Add platform fee to platform wallet
 */
async addPlatformFee(
  amount: number,
  challengeId: string
): Promise<{ wallet: UserWallet; transaction: WalletTransaction }> {
  const platformWallet = await this.getPlatformWallet();
  const newBalance = Number(platformWallet.balance) + amount;

  // Update platform wallet
  const { data: updatedWallet, error: updateError } = await supabase
    .from('user_wallets')
    .update({ balance: newBalance })
    .eq('id', platformWallet.id)
    .select()
    .single();

  if (updateError) throw updateError;

  // Create transaction
  const { data: transaction, error: transactionError } = await supabase
    .from('wallet_transactions')
    .insert({
      wallet_id: platformWallet.id,
      type: 'fee',
      amount: amount,
      challenge_id: challengeId,
      status: 'completed',
      metadata: {
        fee_type: 'platform_fee',
        collected_date: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (transactionError) throw transactionError;

  return {
    wallet: updatedWallet!,
    transaction: transaction!,
  };
}
```

#### Step 2: Update `distributePot()` Function

In `lib/challengePotService.ts`, update `distributePot()`:

```typescript
// Before distributing to winners, collect platform fee
const platformFee = Number(pot.platform_fee_amount);

if (platformFee > 0) {
  await walletService.addPlatformFee(platformFee, challengeId);
  console.log('✅ Platform fee collected:', platformFee);
}

// Then distribute winners pot as before...
```

---

## 📊 Where Platform Fees Go

### Current Flow (Broken)
```
Challenge Pot: £100
├── Platform Fee (30%): £30 ❌ Goes nowhere
└── Winners Pot (70%): £70 ✅ Distributed to winners
```

### Fixed Flow
```
Challenge Pot: £100
├── Platform Fee (30%): £30 ✅ Goes to Platform Wallet
└── Winners Pot (70%): £70 ✅ Distributed to winners
```

### Platform Wallet
- **Purpose**: Collect all platform fees
- **Location**: Database table `user_wallets` with special user ID
- **Viewing**: Create admin dashboard to view total fees collected
- **Withdrawal**: Transfer from platform wallet to your Stripe account (manual or automated)

---

## 🧪 Testing with Stripe Test Mode

### Test Cards (Stripe Test Mode)

Use these cards in the payment sheet:

**Success:**
- `4242 4242 4242 4242` - Visa
- `5555 5555 5555 4444` - Mastercard

**Decline:**
- `4000 0000 0000 0002` - Card declined

**3D Secure:**
- `4000 0025 0000 3155` - Requires authentication

**Expiry**: Any future date (e.g., 12/25)
**CVC**: Any 3 digits (e.g., 123)
**ZIP**: Any 5 digits (e.g., 12345)

---

## 📝 Next Steps Checklist

- [ ] Create Supabase Edge Functions (or separate backend)
- [ ] Deploy Edge Functions
- [ ] Configure Stripe webhook
- [ ] Update WalletScreen to use Stripe React Native
- [ ] Test payment flow with test cards
- [ ] Implement platform fee collection
- [ ] Test platform fee collection
- [ ] Create admin view for platform earnings

---

## 🔗 Key Files to Update

1. **`lib/stripeService.ts`** ✅ Updated to call Edge Function
2. **`screens/WalletScreen.tsx`** ⏳ Needs Stripe React Native integration
3. **`lib/challengePotService.ts`** ⏳ Needs platform fee collection
4. **`lib/walletService.ts`** ⏳ Needs `addPlatformFee()` function

---

## 💡 Quick Start

**For immediate testing (demo mode):**
- Current implementation works but bypasses Stripe
- Funds are added directly to wallet

**For real Stripe test mode:**
- Follow Part 1 above to set up Edge Functions
- Update WalletScreen with Stripe React Native
- Test with Stripe test cards

**For platform fee collection:**
- Follow Part 2 above
- Platform fees will be collected in platform wallet
- View total fees via SQL query or admin dashboard

