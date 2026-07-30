// @ts-nocheck - Deno runtime (Supabase Edge Functions)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const FREE_DEPOSIT_FEE = 3
const PRO_DEPOSIT_FEE = 0

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""

serve(async (req: Request) => {
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
  console.log("STRIPE_SECRET_KEY from env:", stripeKey ? `${stripeKey.slice(0, 8)}...` : "(empty)")
  const isPlaceholder = !stripeKey ||
    stripeKey.includes("your_") ||
    stripeKey.includes("sk_") === false ||
    (stripeKey.startsWith("sk_test_") === false && stripeKey.startsWith("sk_live_") === false)
  if (isPlaceholder) {
    console.error("STRIPE_SECRET_KEY is not set or is a placeholder.")
    return new Response(
      JSON.stringify({
        error: "Stripe secret key not configured. Set STRIPE_SECRET_KEY in Supabase Edge Function secrets.",
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

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
  })

  const authHeader = req.headers.get("Authorization")
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Missing authorization header" }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 401,
      }
    )
  }

  const token = authHeader.replace("Bearer ", "")
  if (!token) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: Invalid authorization header" }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 401,
      }
    )
  }

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
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        status: 401,
      }
    )
  }

  const authenticatedUserId = user.id
  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    const { amount, currency = "gbp" } = await req.json()

    if (amount === undefined || amount === null) {
      return new Response(
        JSON.stringify({ error: "Missing required field: amount" }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 400,
        }
      )
    }

    if (typeof amount !== "number" || isNaN(amount)) {
      return new Response(
        JSON.stringify({ error: "Invalid amount: must be a number" }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 400,
        }
      )
    }

    if (amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Amount must be greater than 0" }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 400,
        }
      )
    }

    const MAX_AMOUNT = 10000
    if (amount > MAX_AMOUNT) {
      return new Response(
        JSON.stringify({ error: `Amount cannot exceed £${MAX_AMOUNT.toLocaleString()}` }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 400,
        }
      )
    }

    const validCurrencies = ["gbp", "usd", "eur"]
    if (typeof currency !== "string" || !validCurrencies.includes(currency.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: `Invalid currency. Supported currencies: ${validCurrencies.join(", ")}` }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 400,
        }
      )
    }

    // Platform deposit fee by tier (Free £3, Pro £0)
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("is_pro")
      .eq("id", authenticatedUserId)
      .single()

    const isPro = profile?.is_pro === true
    const platformFee = isPro ? PRO_DEPOSIT_FEE : FREE_DEPOSIT_FEE
    const finalAmount = Math.round((amount + platformFee) * 100) / 100

    const amountInPence = Math.round(finalAmount * 100)

    if (amountInPence < 50) {
      return new Response(
        JSON.stringify({ error: "Amount must be at least £0.50" }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 400,
        }
      )
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: currency.toLowerCase(),
      metadata: {
        userId: authenticatedUserId,
        purpose: "wallet_deposit",
        originalAmount: (amount * 100).toString(),
        platformFee: (platformFee * 100).toString(),
        isPro: isPro ? "true" : "false",
      },
    })

    console.log("✅ Created wallet deposit payment intent:", {
      paymentIntentId: paymentIntent.id,
      originalAmount: amount,
      platformFee,
      totalAmount: finalAmount,
      isPro,
      userId: authenticatedUserId,
    })

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        originalAmount: amount,
        platformFee,
        stripeFee: platformFee, // backward-compatible alias for clients
        totalAmount: finalAmount,
        isPro,
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
    console.error("Error creating payment intent:", error)
    const errorMessage = error.message || error.toString() || "Failed to create payment intent"
    return new Response(
      JSON.stringify({
        error: errorMessage,
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
