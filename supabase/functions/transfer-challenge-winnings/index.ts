// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Transfers challenge winnings to winners using Stripe Connect
// For now, transfers to user's wallet balance (can be upgraded to direct bank transfers)
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
      {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 500,
      }
    )
  }

  try {
    const { userId, amount, challengeId, paymentIntentIds } = await req.json()

    if (!userId || !amount || !challengeId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId, amount, and challengeId" }),
        {
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 400,
        }
      )
    }

    // For now, we'll add the winnings to the user's wallet balance
    // In the future, you can implement Stripe Connect to transfer directly to user's bank account
    
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
    const newBalance = Number(wallet.balance) + amount

    // Update wallet balance
    const { error: updateError } = await supabase
      .from("user_wallets")
      .update({
        balance: newBalance,
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
        type: "payout",
        amount: amount,
        challenge_id: challengeId,
        status: "completed",
        metadata: {
          payout_date: new Date().toISOString(),
          source: "challenge_win",
          payment_intent_ids: paymentIntentIds || [],
        },
      })

    if (transactionError) {
      console.error("Error creating transaction:", transactionError)
      throw transactionError
    }

    console.log("✅ Challenge winnings transferred:", {
      userId,
      amount,
      challengeId,
      newBalance,
    })

    // TODO: In the future, implement Stripe Connect transfers:
    // const transfer = await stripe.transfers.create({
    //   amount: amountInPence,
    //   currency: "gbp",
    //   destination: connectAccountId, // User's Connect account
    //   metadata: {
    //     challengeId,
    //     userId,
    //   },
    // })

    return new Response(
      JSON.stringify({
        success: true,
        amount,
        newBalance,
        message: "Winnings added to wallet. Future: Will transfer via Stripe Connect.",
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
    console.error("Error transferring winnings:", error)
    const errorMessage = error.message || error.toString() || "Failed to transfer winnings"
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

