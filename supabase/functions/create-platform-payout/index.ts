// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Creates a Stripe Payout to transfer platform fees to bank account
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
})

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
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 500,
      }
    )
  }

  try {
    const { amount, challengeId } = await req.json()

    if (!amount || !challengeId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount and challengeId" }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 400,
        }
      )
    }

    // Convert to pence (Stripe uses smallest currency unit)
    const amountInPence = Math.round(amount * 100)

    // Stripe minimum payout is £1.00
    if (amountInPence < 100) {
      return new Response(
        JSON.stringify({ error: "Minimum payout amount is £1.00" }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 400,
        }
      )
    }

    // Create payout to connected bank account
    // This transfers funds from Stripe balance to your bank account
    const payout = await stripe.payouts.create({
      amount: amountInPence,
      currency: "gbp",
      metadata: {
        type: "platform_fee",
        challengeId: challengeId,
        collectedAt: new Date().toISOString(),
      },
    })

    console.log("✅ Created platform fee payout:", {
      payoutId: payout.id,
      amount: amount,
      challengeId,
      status: payout.status,
      arrivalDate: payout.arrival_date,
    })

    return new Response(
      JSON.stringify({
        payoutId: payout.id,
        amount: amount,
        status: payout.status,
        arrivalDate: payout.arrival_date,
        message: "Platform fee payout created successfully",
      }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error("Error creating platform payout:", error)
    const errorMessage = error.message || error.toString() || "Failed to create payout"
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.stack || "No additional details",
        type: error.type || "unknown",
      }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 500,
      }
    )
  }
})

