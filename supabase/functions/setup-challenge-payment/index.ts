// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Creates a Stripe SetupIntent to save a user's card when they join a 7-day challenge.
// No charge is made here. The actual hold (PaymentIntent) is created at challenge start.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || ""
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

  // Authenticate user
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
    )
  }

  const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: authError } = await userSupabase.auth.getUser(
    authHeader.replace("Bearer ", "")
  )
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Invalid token" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
    )
  }

  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { challengeId } = await req.json()

    if (!challengeId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: challengeId" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    // Validate challenge exists, is 7 days (1 week), and is open
    const { data: challenge, error: challengeError } = await adminSupabase
      .from("challenges")
      .select("id, title, entry_fee, duration_weeks, status, start_date")
      .eq("id", challengeId)
      .single()

    if (challengeError || !challenge) {
      return new Response(
        JSON.stringify({ error: "Challenge not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      )
    }

    if (!["upcoming", "active"].includes(challenge.status)) {
      return new Response(
        JSON.stringify({ error: "Challenge is not open for joining" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    if (challenge.duration_weeks > 1) {
      return new Response(
        JSON.stringify({ error: "Hold-based payments only supported for 7-day (1 week) challenges." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    // Check user isn't already joined
    const { data: existing } = await adminSupabase
      .from("challenge_participants")
      .select("id, status")
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id)
      .single()

    if (existing?.status === "active") {
      return new Response(
        JSON.stringify({ error: "Already joined this challenge" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      )
    }

    // Get or create Stripe customer for this user
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .single()

    let customerId = profile?.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email || undefined,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await adminSupabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id)
    }

    // Create SetupIntent — saves card, no charge
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session", // Allows us to charge the card later (when challenge starts)
      metadata: {
        userId: user.id,
        challengeId,
        purpose: "challenge_hold",
      },
    })

    console.log("✅ Created SetupIntent for challenge hold:", {
      setupIntentId: setupIntent.id,
      challengeId,
      userId: user.id,
    })

    return new Response(
      JSON.stringify({
        setupIntentClientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
        customerId,
        entryFee: challenge.entry_fee,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    )
  } catch (error: any) {
    console.error("Error creating SetupIntent:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Failed to set up payment" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    )
  }
})
