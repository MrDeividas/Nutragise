// @ts-nocheck - Deno runtime (Supabase Edge Functions)
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

serve(async (req: Request) => {
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

    console.log("Received event:", event.type)

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const { userId, purpose, challengeId } = paymentIntent.metadata

      if (!userId) {
        console.error("No userId in payment intent metadata")
        return new Response("No userId in metadata", { status: 400 })
      }

      // Handle Wallet Deposits
      if (purpose === "wallet_deposit") {
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

        console.log("✅ Wallet deposit successful:", userId, "amount:", amount)
      } 
      // Handle Challenge Investments (Escrow)
      else if (purpose === "challenge_investment") {
        if (!challengeId) {
          console.error("No challengeId in payment intent metadata")
          return new Response("No challengeId in metadata", { status: 400 })
        }

        console.log("Processing challenge investment for:", userId, challengeId)

        // Upsert challenge participant record
        const { error: participantError } = await supabase
          .from("challenge_participants")
          .upsert({
            user_id: userId,
            challenge_id: challengeId,
            status: 'active',
            joined_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntent.id
          }, {
            onConflict: 'user_id,challenge_id',
            ignoreDuplicates: false 
          })

        if (participantError) {
          console.error("Error updating challenge participant:", participantError)
          throw participantError
        }

        console.log("✅ Challenge participation recorded:", userId, challengeId)
      }

      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    }

    // HANDLE REFUNDS: charge.refunded
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge
      const paymentIntentId = charge.payment_intent as string
      
      console.log("Processing refund for charge:", charge.id, "PI:", paymentIntentId)

      // Need to fetch PaymentIntent to get metadata
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      const { userId, purpose, source } = paymentIntent.metadata

      // Only handle if it was a "challenge_investment" AND came from "user_wallet_transfer"
      // OR if it was a "wallet_deposit" (rare refund case, but possible)
      
      if (purpose === "challenge_investment" && source === "user_wallet_transfer") {
        console.log("Refund detected for wallet-backed investment. Crediting user wallet:", userId)
        
        const amountRefunded = charge.amount_refunded / 100 // Pence to Pounds
        
        // Credit the user's wallet
        let { data: wallet, error: walletError } = await supabase
          .from("user_wallets")
          .select("*")
          .eq("user_id", userId)
          .single()

        if (walletError || !wallet) {
          console.error("Wallet not found for refund:", userId)
          return new Response("Wallet not found", { status: 404 })
        }

        const newBalance = Number(wallet.balance) + amountRefunded

        // Update wallet balance
        const { error: updateError } = await supabase
          .from("user_wallets")
          .update({ balance: newBalance })
          .eq("id", wallet.id)

        if (updateError) {
          console.error("Error updating wallet balance for refund:", updateError)
          throw updateError
        }

        // Create REFUND transaction record
        await supabase.from("wallet_transactions").insert({
          wallet_id: wallet.id,
          type: "refund",
          amount: amountRefunded,
          stripe_payment_intent_id: paymentIntentId,
          status: "completed",
          metadata: {
            refund_date: new Date().toISOString(),
            charge_id: charge.id,
            reason: "challenge_left"
          },
        })

        console.log(`✅ Refunded £${amountRefunded} to user wallet ${userId}`)
      } else {
        console.log("Refund ignored (not a wallet-backed challenge investment):", paymentIntentId)
      }

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
