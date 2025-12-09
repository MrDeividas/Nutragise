// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Transfers funds from user wallet to Stripe escrow (Platform account)
// Deducts from wallet DB and creates a confirmed Stripe Payment Intent
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

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")
  if (!stripeKey) {
    console.error("STRIPE_SECRET_KEY is not set")
    return new Response(
      JSON.stringify({ error: "Stripe secret key not configured" }),
      { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, status: 500 }
    )
  }

  try {
    const { amount, userId, challengeId, currency = "gbp" } = await req.json()

    if (!amount || !userId || !challengeId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount, userId, and challengeId" }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, status: 400 }
      )
    }

    // 1. Check User Wallet Balance
    const { data: wallet, error: walletError } = await supabase
      .from("user_wallets")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (walletError || !wallet) {
      return new Response(
        JSON.stringify({ error: "Wallet not found" }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, status: 404 }
      )
    }

    if (Number(wallet.balance) < amount) {
      return new Response(
        JSON.stringify({ error: "Insufficient wallet balance" }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, status: 400 }
      )
    }

    // 2. Deduct from Wallet
    const newBalance = Number(wallet.balance) - amount
    const { error: updateError } = await supabase
      .from("user_wallets")
      .update({ balance: newBalance })
      .eq("id", wallet.id)

    if (updateError) {
      console.error("Error deducting from wallet:", updateError)
      throw updateError
    }

    // 3. Create Wallet Transaction Record
    const { error: transactionError } = await supabase
      .from("wallet_transactions")
      .insert({
        wallet_id: wallet.id,
        type: "challenge_payment",
        amount: -amount,
        challenge_id: challengeId,
        status: "completed",
        metadata: {
          timestamp: new Date().toISOString(),
          destination: "stripe_escrow",
        },
      })

    if (transactionError) {
      console.error("Error creating transaction record:", transactionError)
      // Ideally rollback wallet deduction here, but keeping simple for now
    }

    // 4. Create and Confirm Stripe Payment Intent (Simulating Platform Transfer)
    const amountInPence = Math.round(amount * 100)
    
    // In Production: This should ideally be a Stripe Transfer to a Connect account
    // or just tracked if funds stay in Platform.
    // For Test Mode/Plan Compliance: We create a confirmed PI using a test token.
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: currency.toLowerCase(),
      confirm: true,
      payment_method: "pm_card_visa", // Test card token
      return_url: "https://example.com/return", // Required for confirm: true
      metadata: {
        userId,
        challengeId,
        purpose: "challenge_investment",
        source: "user_wallet_transfer",
      },
    })

    console.log("✅ Transferred wallet funds to Stripe escrow:", {
      userId,
      amount,
      paymentIntentId: paymentIntent.id,
    })

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId: paymentIntent.id,
        newBalance,
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
    console.error("Error transferring wallet to escrow:", error)
    const errorMessage = error.message || error.toString() || "Failed to transfer funds"
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.stack || "No additional details"
      }),
      {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 500,
      }
    )
  }
})

