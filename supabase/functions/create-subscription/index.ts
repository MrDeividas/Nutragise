// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Creates a Stripe subscription for Pro membership
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID") || "" // Your £15/month price ID
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

  if (!Deno.env.get("STRIPE_SECRET_KEY")) {
    console.error("STRIPE_SECRET_KEY is not set")
    return new Response(
      JSON.stringify({ error: "Stripe secret key not configured" }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 500,
      }
    )
  }

  if (!proPriceId) {
    console.error("STRIPE_PRO_PRICE_ID is not set")
    return new Response(
      JSON.stringify({ error: "Pro price ID not configured. Please add STRIPE_PRO_PRICE_ID to environment variables." }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 500,
      }
    )
  }

  try {
    const { userId, userEmail, userName } = await req.json()

    if (!userId || !userEmail) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: userId and userEmail" }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 400,
        }
      )
    }

    // Check if user already has a Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, stripe_subscription_id, subscription_status")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      throw new Error("Failed to fetch user profile")
    }

    // Check if user already has an active subscription
    if (profile.subscription_status === "active" && profile.stripe_subscription_id) {
      return new Response(
        JSON.stringify({ 
          error: "You already have an active Pro subscription",
          subscriptionId: profile.stripe_subscription_id,
        }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 400,
        }
      )
    }

    let customerId = profile.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      console.log("Creating new Stripe customer for user:", userId)
      const customer = await stripe.customers.create({
        email: userEmail,
        name: userName || userEmail.split("@")[0],
        metadata: {
          userId: userId,
        },
      })
      customerId = customer.id

      // Save customer ID to database
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userId)

      if (updateError) {
        console.error("Error updating profile with customer ID:", updateError)
        // Continue anyway - we can fix this later
      }

      console.log("✅ Created Stripe customer:", customerId)
    }

    // Verify the price exists before creating checkout session
    try {
      const price = await stripe.prices.retrieve(proPriceId)
      console.log("✅ Price verified:", { id: price.id, active: price.active, currency: price.currency, amount: price.unit_amount })
    } catch (priceError: any) {
      console.error("❌ Error verifying price:", priceError)
      const errorMessage = priceError.message || "Price not found"
      return new Response(
        JSON.stringify({ 
          error: `Invalid Price ID: ${errorMessage}. Please check that STRIPE_PRO_PRICE_ID (${proPriceId}) exists in your Stripe account and matches your Stripe secret key mode (test/live).`,
          priceId: proPriceId,
          details: priceError.toString()
        }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 400,
        }
      )
    }

    // Create Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: proPriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: "nutrapp://subscription-success",
      cancel_url: "nutrapp://subscription-cancel",
      metadata: {
        userId: userId,
      },
      subscription_data: {
        metadata: {
          userId: userId,
        },
      },
    })

    console.log("✅ Created subscription checkout session:", session.id)

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        checkoutUrl: session.url,
        customerId: customerId,
      }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error("Error creating subscription:", error)
    const errorMessage = error.message || error.toString() || "Failed to create subscription"
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.stack || "No additional details"
      }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 500,
      }
    )
  }
})

