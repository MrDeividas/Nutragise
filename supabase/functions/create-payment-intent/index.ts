// @ts-nocheck - Deno runtime (Supabase Edge Functions)
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

  // Check if Stripe key is configured
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
    const { amount, userId, currency = "gbp", includeStripeFee = true } = await req.json()

    if (!amount || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: amount and userId" }),
        {
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
          status: 400,
        }
      )
    }

    // Calculate Stripe fee if user is covering fees (default: true)
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
      
      console.log(`💰 Wallet deposit - Stripe fee calculated: £${stripeFee.toFixed(2)} (total: £${finalAmount.toFixed(2)})`);
    }

    // Convert to pence (Stripe uses smallest currency unit)
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

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPence,
      currency: currency.toLowerCase(),
      metadata: {
        userId,
        purpose: "wallet_deposit",
        originalAmount: (amount * 100).toString(), // Original amount in pence (before fee)
        stripeFee: (stripeFee * 100).toString(), // Stripe fee in pence
        includeStripeFee: includeStripeFee ? "true" : "false",
      },
    })

    console.log("✅ Created wallet deposit payment intent:", {
      paymentIntentId: paymentIntent.id,
      originalAmount: amount,
      stripeFee: stripeFee,
      totalAmount: finalAmount,
      userId,
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
