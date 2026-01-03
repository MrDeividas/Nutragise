// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Creates a Stripe subscription with Payment Sheet (in-app payment)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID") || ""
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

    // Verify the price exists
    try {
      const price = await stripe.prices.retrieve(proPriceId)
      console.log("✅ Price verified:", { id: price.id, active: price.active })
    } catch (priceError: any) {
      console.error("❌ Error verifying price:", priceError)
      return new Response(
        JSON.stringify({ 
          error: `Invalid Price ID: ${priceError.message}. Please check that STRIPE_PRO_PRICE_ID (${proPriceId}) exists in your Stripe account.`,
          priceId: proPriceId,
        }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 400,
        }
      )
    }

    // Create subscription with incomplete payment
    // This creates a subscription that requires payment confirmation via Payment Sheet
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: proPriceId,
        },
      ],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: ["latest_invoice.payment_intent"],
      metadata: {
        userId: userId,
      },
    })

    // Get the payment intent client secret from the subscription's latest invoice
    const latestInvoice = subscription.latest_invoice as Stripe.Invoice
    let paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent

    if (!paymentIntent || !paymentIntent.client_secret) {
      throw new Error("Failed to create payment intent for subscription")
    }

    // Update Payment Intent to support Apple Pay and Google Pay
    // This ensures these payment methods are available in Payment Sheet
    // Note: Payment Intent uses lowercase with underscores
    try {
      paymentIntent = await stripe.paymentIntents.update(paymentIntent.id, {
        payment_method_types: ['card', 'apple_pay', 'google_pay'],
      })
      console.log("✅ Updated Payment Intent with wallet payment methods")
    } catch (updateError) {
      console.warn("⚠️ Could not update Payment Intent payment methods, continuing with default:", updateError)
      // Continue with original payment intent - it should still work
    }

    console.log("✅ Created subscription with Payment Sheet:", {
      subscriptionId: subscription.id,
      customerId: customerId,
      paymentIntentId: paymentIntent.id,
      paymentMethods: paymentIntent.payment_method_types,
    })

    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
        customerId: customerId,
      }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error("Error creating subscription payment sheet:", error)
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

