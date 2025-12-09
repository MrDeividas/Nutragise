// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Refunds a challenge payment when user leaves before challenge starts
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
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 500,
      }
    )
  }

  try {
    const { paymentIntentId, amount } = await req.json()

    if (!paymentIntentId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: paymentIntentId" }),
        {
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 400,
        }
      )
    }

    // Get the payment intent to check its status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== "succeeded") {
      return new Response(
        JSON.stringify({ 
          error: `Payment intent is not in succeeded status. Current status: ${paymentIntent.status}` 
        }),
        {
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 400,
        }
      )
    }

    // Create refund
    const refundParams: any = {
      payment_intent: paymentIntentId,
    }

    // If amount is specified, do partial refund
    if (amount) {
      const amountInPence = Math.round(amount * 100)
      refundParams.amount = amountInPence
    }

    const refund = await stripe.refunds.create(refundParams)

    console.log("✅ Refund created:", {
      refundId: refund.id,
      paymentIntentId,
      amount: refund.amount / 100,
    })

    return new Response(
      JSON.stringify({
        refundId: refund.id,
        amount: refund.amount / 100, // Convert back to pounds
        status: refund.status,
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
    console.error("Error creating refund:", error)
    const errorMessage = error.message || error.toString() || "Failed to create refund"
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

