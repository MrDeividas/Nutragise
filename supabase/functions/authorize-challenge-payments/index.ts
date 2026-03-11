// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Called by cron at challenge start time.
// Creates a PaymentIntent with capture_method: "manual" (a HOLD) for each participant
// who saved their card via SetupIntent. The 7-day Stripe clock starts here.
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
  const now = new Date()
  const nowISO = now.toISOString()

  try {
    // Find all challenges that have just started (start_date <= now)
    // and have participants who saved their card but haven't had a hold placed yet
    const { data: challenges, error: challengesError } = await supabase
      .from("challenges")
      .select("id, title, entry_fee")
      .lte("start_date", nowISO)
      .in("status", ["active", "upcoming"])

    if (challengesError) throw challengesError

    if (!challenges || challenges.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No challenges to authorize", authorized: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    let totalAuthorized = 0
    const errors: any[] = []

    for (const challenge of challenges) {
      // Find participants with a saved card who need a hold created
      const { data: participants, error: participantsError } = await supabase
        .from("challenge_participants")
        .select("id, user_id, stripe_payment_method_id, stripe_setup_intent_id")
        .eq("challenge_id", challenge.id)
        .eq("payment_capture_method", "hold")
        .not("stripe_payment_method_id", "is", null)
        .is("stripe_payment_intent_id", null)
        .eq("payment_settled", false)

      if (participantsError || !participants || participants.length === 0) continue

      const entryFee = challenge.entry_fee || 0
      if (entryFee <= 0) continue

      const amountInPence = Math.round(entryFee * 100)

      for (const participant of participants) {
        try {
          // Get user's stripe_customer_id
          const { data: profile } = await supabase
            .from("profiles")
            .select("stripe_customer_id")
            .eq("id", participant.user_id)
            .single()

          if (!profile?.stripe_customer_id) {
            console.error(`No stripe_customer_id for user ${participant.user_id}`)
            continue
          }

          // Create PaymentIntent with manual capture = HOLD on the card
          const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInPence,
            currency: "gbp",
            customer: profile.stripe_customer_id,
            payment_method: participant.stripe_payment_method_id,
            capture_method: "manual", // This is the hold — money reserved, not taken
            confirm: true, // Confirm immediately using the saved payment method
            off_session: true, // User is not present; use saved card
            metadata: {
              userId: participant.user_id,
              challengeId: challenge.id,
              purpose: "challenge_hold",
              participantId: participant.id,
            },
          })

          // Store PaymentIntent ID and authorization timestamp
          await supabase
            .from("challenge_participants")
            .update({
              stripe_payment_intent_id: paymentIntent.id,
              payment_authorized_at: nowISO,
            })
            .eq("id", participant.id)

          console.log(`✅ Hold placed for participant ${participant.id}:`, {
            paymentIntentId: paymentIntent.id,
            amount: entryFee,
            userId: participant.user_id,
            challengeId: challenge.id,
          })

          totalAuthorized++
        } catch (err: any) {
          console.error(`❌ Failed to place hold for participant ${participant.id}:`, err.message)
          errors.push({
            participantId: participant.id,
            challengeId: challenge.id,
            error: err.message,
          })
          // Mark participant payment as failed so they can be notified / re-authorised
          await supabase
            .from("challenge_participants")
            .update({ payment_capture_method: "free" }) // Fallback: no payment hold
            .eq("id", participant.id)
        }
      }
    }

    console.log(`✅ Authorized ${totalAuthorized} holds`)

    return new Response(
      JSON.stringify({
        success: true,
        authorized: totalAuthorized,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  } catch (error: any) {
    console.error("Error in authorize-challenge-payments:", error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})
