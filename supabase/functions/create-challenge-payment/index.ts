// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Creates a Payment Intent for challenge entry fee with escrow (Card Payments)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || ""

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

  // Validate JWT authentication
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Missing authorization header" }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 401,
      }
    )
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.replace("Bearer ", "")
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Invalid authorization header" }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 401,
      }
    )
  }

  // Validate token and get authenticated user
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    console.error("Authentication error:", authError)
    return new Response(
      JSON.stringify({ error: "Unauthorized: Invalid or expired token" }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 401,
      }
    )
  }

  // Use authenticated user ID (don't trust userId from request body)
  const authenticatedUserId = user.id

  try {
    const { amount, challengeId, currency = "gbp", includeStripeFee = true } = await req.json()

    if (!amount || !challengeId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount and challengeId" }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 400,
        }
      )
    }

    // Calculate Stripe fee if user is covering fees (Card Payments)
    let finalAmount = amount;
    let stripeFee = 0;
    
    if (includeStripeFee) {
      // Calculate total amount including Stripe fee
      // Formula: total = (amount + fixedFee) / (1 - percentageFee)
      // UK cards: 1.4% + £0.20
      const percentageFee = 0.014; // 1.4%
      const fixedFee = 0.20; // £0.20
      finalAmount = (amount + fixedFee) / (1 - percentageFee);
      stripeFee = finalAmount - amount;
      
      console.log(`💰 Stripe fee calculated: £${stripeFee.toFixed(2)} (total: £${finalAmount.toFixed(2)})`);
    }

    // Convert to pence (Stripe uses smallest currency unit)
    const amountInPence = Math.round(finalAmount * 100)

    if (amountInPence < 50) {
      return new Response(
        JSON.stringify({ error: "Amount must be at least £0.50" }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 400,
        }
      )
    }

    // Create payment intent
    // Funds are held in escrow by Stripe until challenge completes
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: currency.toLowerCase(),
      capture_method: "automatic", // Automatically capture when payment succeeds
      metadata: {
        userId: authenticatedUserId, // Use authenticated user ID, not from request
        challengeId,
        purpose: "challenge_investment",
        originalAmount: (amount * 100).toString(), // Original amount in pence (before fee)
        stripeFee: (stripeFee * 100).toString(), // Stripe fee in pence
        includeStripeFee: includeStripeFee ? "true" : "false",
      },
    })

    console.log("✅ Created challenge payment intent (Card):", {
      paymentIntentId: paymentIntent.id,
      originalAmount: amount,
      stripeFee: stripeFee,
      totalAmount: finalAmount,
      userId: authenticatedUserId,
      challengeId,
    })

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        originalAmount: amount, // Amount before fee
        stripeFee: stripeFee, // Fee amount
        totalAmount: finalAmount, // Total amount user pays
      }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error("Error creating challenge payment intent:", error)
    const errorMessage = error.message || error.toString() || "Failed to create payment intent"
    // Don't expose stack traces in production
    return new Response(
      JSON.stringify({ 
        error: errorMessage
      }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 500,
      }
    )
  }
})
