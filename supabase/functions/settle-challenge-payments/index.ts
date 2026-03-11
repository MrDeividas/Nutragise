// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Called when a challenge ends (triggered from check-ended-challenges).
// Winners: cancel the hold (never charged).
// Losers: capture the hold (charged).
// Then credits winners' wallets with their share of the losers' pool.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

const PLATFORM_FEE_PERCENTAGE = 0.30 // 30% of losers' stakes

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY")
  const isPlaceholder = !stripeKey || stripeKey.includes("your_") ||
    (!stripeKey.startsWith("sk_test_") && !stripeKey.startsWith("sk_live_"))
  if (isPlaceholder) {
    return new Response(
      JSON.stringify({ error: "Stripe secret key not configured." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  })

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { challengeId } = await req.json()

    if (!challengeId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: challengeId" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    // Get challenge details
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("id, title, entry_fee")
      .eq("id", challengeId)
      .single()

    if (challengeError || !challenge) {
      return new Response(
        JSON.stringify({ error: "Challenge not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      )
    }

    // Get all participants with a hold to settle
    const { data: participants, error: participantsError } = await supabase
      .from("challenge_participants")
      .select("id, user_id, status, stripe_payment_intent_id, payment_capture_method, completion_percentage, is_invalid")
      .eq("challenge_id", challengeId)
      .eq("payment_capture_method", "hold")
      .not("stripe_payment_intent_id", "is", null)
      .eq("payment_settled", false)

    if (participantsError) throw participantsError

    if (!participants || participants.length === 0) {
      console.log(`ℹ️ No hold-based participants to settle for challenge ${challengeId}`)
      return new Response(
        JSON.stringify({ success: true, message: "No hold payments to settle", settled: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const entryFee = challenge.entry_fee || 0
    const winners: typeof participants = []
    const losers: typeof participants = []
    const errors: any[] = []

    // Separate winners from losers (ignore invalid participants)
    for (const p of participants) {
      if (p.is_invalid) continue
      if (p.status === "completed" && p.completion_percentage === 100) {
        winners.push(p)
      } else {
        losers.push(p)
      }
    }

    const everyoneWon = losers.length === 0

    // --- Settle losers: capture their hold (charge them) ---
    let totalCaptured = 0
    for (const loser of losers) {
      try {
        const pi = await stripe.paymentIntents.retrieve(loser.stripe_payment_intent_id)

        if (pi.status === "requires_capture") {
          await stripe.paymentIntents.capture(loser.stripe_payment_intent_id)
          totalCaptured += entryFee
          console.log(`💸 Captured hold for loser ${loser.user_id}: £${entryFee}`)
        } else if (pi.status === "canceled" || pi.status === "succeeded") {
          console.log(`ℹ️ PaymentIntent ${loser.stripe_payment_intent_id} already in status ${pi.status}`)
        } else {
          console.warn(`⚠️ Unexpected PI status ${pi.status} for loser ${loser.user_id}`)
        }

        await supabase
          .from("challenge_participants")
          .update({ payment_settled: true })
          .eq("id", loser.id)
      } catch (err: any) {
        console.error(`❌ Failed to capture for loser ${loser.user_id}:`, err.message)
        errors.push({ userId: loser.user_id, action: "capture", error: err.message })
      }
    }

    // --- Settle winners: cancel their hold (never charged) ---
    for (const winner of winners) {
      try {
        const pi = await stripe.paymentIntents.retrieve(winner.stripe_payment_intent_id)

        if (pi.status === "requires_capture") {
          await stripe.paymentIntents.cancel(winner.stripe_payment_intent_id)
          console.log(`✅ Cancelled hold for winner ${winner.user_id} — not charged`)
        } else if (pi.status === "canceled") {
          console.log(`ℹ️ Hold already cancelled for winner ${winner.user_id}`)
        } else {
          console.warn(`⚠️ Unexpected PI status ${pi.status} for winner ${winner.user_id}`)
        }

        await supabase
          .from("challenge_participants")
          .update({ payment_settled: true })
          .eq("id", winner.id)
      } catch (err: any) {
        console.error(`❌ Failed to cancel hold for winner ${winner.user_id}:`, err.message)
        errors.push({ userId: winner.user_id, action: "cancel", error: err.message })
      }
    }

    // --- Distribute losers' pool to winners' wallets ---
    if (everyoneWon) {
      // No losers → everyone gets their hold cancelled, no redistribution needed
      console.log("🎉 Everyone completed the challenge — all holds cancelled, no redistribution needed")
    } else if (winners.length > 0 && totalCaptured > 0) {
      // Platform takes 30% of losers' stakes
      const losersStakes = losers.length * entryFee
      const platformFee = losersStakes * PLATFORM_FEE_PERCENTAGE
      const winnersPot = losersStakes - platformFee
      const payoutPerWinner = winnersPot / winners.length

      console.log("💰 Distribution:", {
        losersCount: losers.length,
        winnersCount: winners.length,
        losersStakes,
        platformFee,
        winnersPot,
        payoutPerWinner,
      })

      for (const winner of winners) {
        try {
          // Credit winner's in-app wallet
          const { data: currentWallet } = await supabase
            .from("wallets")
            .select("balance")
            .eq("user_id", winner.user_id)
            .single()

          const currentBalance = Number(currentWallet?.balance || 0)
          const newBalance = currentBalance + payoutPerWinner

          await supabase
            .from("wallets")
            .upsert({ user_id: winner.user_id, balance: newBalance })

          // Record transaction
          await supabase.from("wallet_transactions").insert({
            user_id: winner.user_id,
            amount: payoutPerWinner,
            type: "challenge_winnings",
            description: `Challenge winnings from ${challenge.title}`,
            reference_id: challengeId,
            balance_after: newBalance,
          })

          // Update participant as completed with payout recorded
          await supabase
            .from("challenge_participants")
            .update({ payout_amount: payoutPerWinner })
            .eq("id", winner.id)

          console.log(`✅ Credited £${payoutPerWinner.toFixed(2)} to winner ${winner.user_id}`)
        } catch (err: any) {
          console.error(`❌ Failed to credit winner ${winner.user_id}:`, err.message)
          errors.push({ userId: winner.user_id, action: "credit_wallet", error: err.message })
        }
      }

      // Record platform fee in challenge pot
      await supabase
        .from("challenge_pots")
        .update({
          platform_fee_amount: platformFee,
          winners_pot: winnersPot,
          status: "completed",
          distributed_at: new Date().toISOString(),
        })
        .eq("challenge_id", challengeId)
    } else if (winners.length === 0 && totalCaptured > 0) {
      // No winners — all captured funds are platform revenue
      console.log(`ℹ️ No winners — £${totalCaptured} stays as platform revenue`)
      await supabase
        .from("challenge_pots")
        .update({
          platform_fee_amount: totalCaptured,
          winners_pot: 0,
          status: "completed",
          distributed_at: new Date().toISOString(),
        })
        .eq("challenge_id", challengeId)
    }

    return new Response(
      JSON.stringify({
        success: true,
        settled: participants.length,
        winners: winners.length,
        losers: losers.length,
        totalCaptured,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error: any) {
    console.error("Error in settle-challenge-payments:", error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})
