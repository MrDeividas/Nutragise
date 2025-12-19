# Deploy Edge Functions via Supabase Web Dashboard

## No Command Line Needed! 🎉

Follow these steps in your web browser to deploy the Stripe functions.

---

## Step 1: Go to Edge Functions in Supabase Dashboard

1. Open your browser
2. Go to: https://supabase.com/dashboard/project/gtnjrauujrzkesaulius
3. Click **Edge Functions** in the left sidebar (under "Project" section)

---

## Step 2: Create "create-payment-intent" Function

1. Click **Create a new function** button
2. Function name: `create-payment-intent`
3. Click **Create function**
4. You'll see a file explorer on the left and code editor on the right
5. **IMPORTANT**: Make sure you see `index.ts` file in the file explorer (left side)
6. If you don't see `index.ts`, click the **+** button or **New File** and create `index.ts`
7. Click on `index.ts` in the file explorer to open it
8. **Delete all the default code** in the editor
9. **Copy and paste** the code below into the `index.ts` file
10. Click **Deploy** button (top right)

### Code to paste:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    })
  }

  try {
    const { amount, userId, currency = "gbp" } = await req.json()

    if (!amount || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount and userId" }),
        {
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 400,
        }
      )
    }

    // Convert to pence (Stripe uses smallest currency unit)
    const amountInPence = Math.round(amount * 100)

    if (amountInPence < 50) {
      return new Response(
        JSON.stringify({ error: "Amount must be at least £0.50" }),
        {
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 400,
        }
      )
    }

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
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error("Error creating payment intent:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create payment intent" }),
      {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 400,
      }
    )
  }
})
```

---

## Step 3: Create "stripe-webhook" Function

1. Click **Create a new function** button again
2. Function name: `stripe-webhook`
3. Click **Create function**
4. **IMPORTANT**: Make sure you see `index.ts` file in the file explorer (left side)
5. If you don't see `index.ts`, click the **+** button or **New File** and create `index.ts`
6. Click on `index.ts` in the file explorer to open it
7. **Delete all the default code** in the editor
8. **Copy and paste** the code below into the `index.ts` file
9. Click **Deploy** button

### Code to paste:

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
        console.error("No userId in payment intent metadata")
        return new Response("No userId in metadata", { status: 400 })
      }

      // Get or create wallet
      let { data: wallet, error: walletError } = await supabase
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
          console.error("Error creating wallet:", createError)
          throw createError
        }
        wallet = newWallet
      }

      const walletId = wallet.id
      const amount = paymentIntent.amount / 100 // Convert from pence to pounds

      // Update wallet balance
      const { error: updateError } = await supabase
        .from("user_wallets")
        .update({
          balance: (wallet.balance || 0) + amount,
        })
        .eq("id", walletId)

      if (updateError) {
        console.error("Error updating wallet balance:", updateError)
        throw updateError
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: walletId,
          type: "deposit",
          amount: amount,
          stripe_payment_intent_id: paymentIntent.id,
          status: "completed",
          metadata: {
            deposit_date: new Date().toISOString(),
          },
        })

      if (transactionError) {
        console.error("Error creating transaction:", transactionError)
        throw transactionError
      }

      console.log("Wallet deposit successful:", userId, "amount:", amount)

      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    }

    // Handle other event types if needed
    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (error: any) {
    console.error("Webhook error:", error)
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

## Step 4: Set Environment Variables (Secrets)

1. In the Supabase Dashboard, go to **Project Settings** (gear icon in left sidebar)
2. Click **Edge Functions** in the settings menu
3. Scroll down to **Secrets** section
4. Click **Add secret** for each of these:

### Secret 1: STRIPE_SECRET_KEY
- **Name**: `STRIPE_SECRET_KEY`
- **Value**: `sk_test_YOUR_STRIPE_SECRET_KEY_HERE` (Get this from your Stripe Dashboard → Developers → API keys)
- Click **Save**

### Secret 2: SUPABASE_URL
- **Name**: `SUPABASE_URL`
- **Value**: `https://gtnjrauujrzkesaulius.supabase.co`
- Click **Save**

### Secret 3: SUPABASE_SERVICE_ROLE_KEY
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: Get this from **Settings → API → service_role key** (copy the long key)
- Click **Save**

### Secret 4: STRIPE_WEBHOOK_SECRET
- **Name**: `STRIPE_WEBHOOK_SECRET`
- **Value**: You'll get this after setting up the Stripe webhook (see Step 5)
- Click **Save** (after you get the webhook secret)

---

## Step 5: Set Up Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Make sure you're in **Test Mode** (toggle in top right)
3. Click **Add endpoint** button
4. **Endpoint URL**: 
   ```
   https://gtnjrauujrzkesaulius.supabase.co/functions/v1/stripe-webhook
   ```
5. **Description**: `Nutrapp Wallet Deposits`
6. **Events to send**: Click **Select events**
   - Check: `payment_intent.succeeded`
   - Click **Add events**
7. Click **Add endpoint**
8. **Copy the Signing secret** (starts with `whsec_`)
9. Go back to Supabase Dashboard → Settings → Edge Functions → Secrets
10. Add secret:
    - **Name**: `STRIPE_WEBHOOK_SECRET`
    - **Value**: Paste the `whsec_...` secret you copied
    - Click **Save**

---

## Step 6: Test the Functions

### Test Payment Intent Function

1. Go back to **Edge Functions** in Supabase Dashboard
2. Click on `create-payment-intent` function
3. Click **Invoke** tab
4. In the request body, paste:
   ```json
   {
     "amount": 10,
     "userId": "YOUR_USER_ID_HERE",
     "currency": "gbp"
   }
   ```
5. Click **Invoke function**
6. You should see a response with `clientSecret` and `paymentIntentId`

---

## ✅ Done!

Your functions are now deployed and ready to use!

**Function URLs:**
- Payment Intent: `https://gtnjrauujrzkesaulius.supabase.co/functions/v1/create-payment-intent`
- Webhook: `https://gtnjrauujrzkesaulius.supabase.co/functions/v1/stripe-webhook`

---

## Troubleshooting

### Function not working?
- Check the **Logs** tab in the function editor
- Make sure all secrets are set correctly
- Verify the function code was pasted correctly

### Webhook not receiving events?
- Check Stripe Dashboard → Webhooks → Endpoint logs
- Verify the webhook URL is correct
- Make sure `STRIPE_WEBHOOK_SECRET` is set in Supabase secrets

### Can't find Edge Functions?
- Make sure you're on the correct project
- Edge Functions might be in beta - check if you need to enable it in project settings

