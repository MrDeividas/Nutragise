// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Gets Stripe Customer Portal URL for subscription management
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
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

  try {
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: userId" }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 400,
        }
      )
    }

    // Get user's Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id, subscription_status")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError)
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 404,
        }
      )
    }

    if (!profile.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "No Stripe customer found. Please subscribe first." }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 400,
        }
      )
    }

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: "nutrapp://profile", // Return to profile screen in app
    })

    console.log("✅ Created customer portal session for:", userId)

    return new Response(
      JSON.stringify({
        portalUrl: session.url,
      }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error("Error creating customer portal session:", error)
    const errorMessage = error.message || error.toString() || "Failed to create customer portal session"
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

