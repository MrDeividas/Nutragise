# Stripe Test Mode Implementation Plan

## Current Status

✅ **Stripe Keys Configured**: Test keys are in `.env` file
- `STRIPE_PUBLISHABLE_KEY=pk_test_...`
- `STRIPE_SECRET_KEY=sk_test_...`

❌ **Not Using Real Stripe**: Currently using demo mode (bypasses Stripe)

## Implementation Options

### Option 1: Supabase Edge Functions (Recommended)
- Serverless functions hosted by Supabase
- No separate backend needed
- Integrated with your existing Supabase setup

### Option 2: Separate Backend API
- Express.js/Node.js server
- More control but requires hosting

**We'll use Option 1 (Supabase Edge Functions)**

---

## Step 1: Create Supabase Edge Functions

### 1.1 Install Supabase CLI (if not installed)

```bash
npm install -g supabase
```

### 1.2 Initialize Supabase Functions

```bash
cd "/Users/mac/Documents/nutrapp Test design"
supabase functions new create-payment-intent
supabase functions new stripe-webhook
```

### 1.3 Create Payment Intent Function

**File: `supabase/functions/create-payment-intent/index.ts`**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  try {
    const { amount, userId, currency = "gbp" } = await req.json()

    // Convert to pence (Stripe uses smallest currency unit)
    const amountInPence = Math.round(amount * 100)

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: currency.toLowerCase(),
      metadata: {
        userId,
        purpose: "wallet_deposit",
      },
    })

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
```

### 1.4 Create Webhook Function

**File: `supabase/functions/stripe-webhook/index.ts`**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const signature = req.headers.get("stripe-signature")
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""

  if (!signature) {
    return new Response("No signature", { status: 400 })
  }

  try {
    const body = await req.text()
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    )

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const userId = paymentIntent.metadata.userId

      if (!userId) {
        return new Response("No userId in metadata", { status: 400 })
      }

      // Get wallet
      const { data: wallet, error: walletError } = await supabase
        .from("user_wallets")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (walletError || !wallet) {
        // Create wallet if doesn't exist
        const { data: newWallet, error: createError } = await supabase
          .from("user_wallets")
          .insert({
            user_id: userId,
            balance: 0,
          })
          .select()
          .single()

        if (createError) {
          throw createError
        }
      }

      const walletId = wallet?.id || newWallet.id
      const amount = paymentIntent.amount / 100 // Convert from pence

      // Update wallet balance
      const { error: updateError } = await supabase
        .from("user_wallets")
        .update({
          balance: (wallet?.balance || 0) + amount,
        })
        .eq("id", walletId)

      if (updateError) throw updateError

      // Create transaction record
      await supabase.from("wallet_transactions").insert({
        wallet_id: walletId,
        type: "deposit",
        amount: amount,
        stripe_payment_intent_id: paymentIntent.id,
        status: "completed",
        metadata: {
          deposit_date: new Date().toISOString(),
        },
      })

      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    )
  }
})
```

---

## Step 2: Update WalletScreen to Use Real Stripe

Replace the demo implementation with real Stripe integration using `@stripe/stripe-react-native`.

---

## Step 3: Platform Fee Collection

### Current Issue
Platform fees are **calculated and stored** in `challenge_pots.platform_fee_amount` but **NOT actually collected** anywhere. They're just deducted from the winners pot.

### Solution: Create Platform Wallet

1. **Create a platform/admin wallet** to collect fees
2. **When pot is distributed**, transfer platform fee to platform wallet
3. **Record as transaction** with type `fee`

---

## Next Steps

1. Set up Supabase Edge Functions
2. Update WalletScreen with Stripe React Native
3. Implement platform fee collection
4. Test with Stripe test cards

