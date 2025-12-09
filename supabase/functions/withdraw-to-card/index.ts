// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Withdraws funds from user wallet to their original payment method (Stripe Refund)
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
    const { amount, userId } = await req.json()

    if (!amount || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount and userId" }),
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

    // 2. Find a suitable PaymentIntent to refund
    // We need to find a recent successful PaymentIntent from this user that has enough refundable amount
    // In a real app, you'd track which PI funded which wallet balance, but for MVP we search recent PIs.
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 10,
      // We can't easily filter by metadata here efficiently without advanced search,
      // so we fetch recent ones and filter in code.
    });

    // Filter for PIs belonging to this user that are 'succeeded' and have funds
    const suitablePI = paymentIntents.data.find(pi => 
      pi.metadata.userId === userId && 
      pi.status === 'succeeded' &&
      (pi.amount - (pi.amount_refunded || 0)) >= (amount * 100) // Check if enough funds remain
    );

    if (!suitablePI) {
      return new Response(
        JSON.stringify({ 
          error: "No suitable payment method found to refund to. Please contact support." 
        }),
        { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }, status: 400 }
      )
    }

    console.log(`Found suitable PI for withdrawal: ${suitablePI.id} (Refundable: ${(suitablePI.amount - (suitablePI.amount_refunded || 0))/100})`);

    // 3. Create Refund on Stripe
    const refund = await stripe.refunds.create({
      payment_intent: suitablePI.id,
      amount: Math.round(amount * 100), // Convert to pence
      metadata: {
        type: "user_withdrawal",
        userId: userId
      }
    });

    // 4. Deduct from Wallet
    const newBalance = Number(wallet.balance) - amount
    const { error: updateError } = await supabase
      .from("user_wallets")
      .update({ balance: newBalance })
      .eq("id", wallet.id)

    if (updateError) {
      console.error("Error deducting from wallet:", updateError)
      // Critical error: Refund succeeded but DB failed. 
      // In production, you'd want to alert admins or retry.
      throw updateError
    }

    // 5. Create Transaction Record
    await supabase
      .from("wallet_transactions")
      .insert({
        wallet_id: wallet.id,
        type: "withdrawal",
        amount: -amount,
        status: "completed",
        stripe_payment_intent_id: suitablePI.id,
        metadata: {
          withdrawal_date: new Date().toISOString(),
          refund_id: refund.id,
          destination: "card"
        },
      })

    return new Response(
      JSON.stringify({
        success: true,
        newBalance,
        refundId: refund.id,
        message: `Withdrawal processed to card ending in ${suitablePI.payment_method_options?.card?.last4 || '****'}`
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
    console.error("Error processing withdrawal:", error)
    const errorMessage = error.message || error.toString() || "Failed to process withdrawal"
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

