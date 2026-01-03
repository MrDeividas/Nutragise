// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Transfers funds from user wallet to Stripe escrow (Platform account)
// Deducts from wallet DB and tracks the transfer
// Note: Funds are already in Stripe platform account from original wallet deposit,
// so we only need to track the transfer in our database, not create a Payment Intent
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
          source: "user_wallet_transfer",
        },
      })

    if (transactionError) {
      console.error("Error creating transaction record:", transactionError)
      // Ideally rollback wallet deduction here, but keeping simple for now
    }

    // 4. Generate tracking ID for wallet transfer
    // Funds are already in Stripe platform account from original wallet deposit,
    // so we don't need to create a Payment Intent. We just track the transfer.
    const transferId = `wallet_transfer_${Date.now()}_${userId.substring(0, 8)}`
    const timestamp = new Date().toISOString()

    console.log("✅ Transferred wallet funds to Stripe escrow:", {
      userId,
      amount,
      challengeId,
      transferId,
      newBalance,
      note: "Funds already in Stripe platform account from original wallet deposit",
    })

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId: transferId, // Tracking ID for compatibility with existing code
        transferId: transferId, // Explicit tracking ID
        paidFromWallet: true, // Flag to indicate wallet payment
        newBalance,
        timestamp,
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

