// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Syncs subscription status from Stripe to database
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

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    })
  }

  try {
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing userId" }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 400,
        }
      )
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, stripe_customer_id, stripe_subscription_id")
      .eq("id", userId)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 404,
        }
      )
    }

    // If no customer ID, try to find customer by email
    let customerId = profile.stripe_customer_id
    
    if (!customerId && profile.email) {
      console.log("⚠️ No customer ID found, searching by email:", profile.email)
      try {
        const customers = await stripe.customers.list({
          email: profile.email,
          limit: 1,
        })
        
        if (customers.data.length > 0) {
          customerId = customers.data[0].id
          console.log("✅ Found customer by email:", customerId)
          
          // Update profile with customer ID
          await supabase
            .from("profiles")
            .update({ stripe_customer_id: customerId })
            .eq("id", userId)
        }
      } catch (emailError) {
        console.error("❌ Error searching for customer by email:", emailError)
      }
    }

    if (!customerId) {
      return new Response(
        JSON.stringify({ 
          error: "No Stripe customer ID found and could not find customer by email",
          hasSubscription: false,
          isPro: false
        }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 200,
        }
      )
    }

    // Get customer's subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 10,
    })

    // Find the most recent active subscription
    const activeSubscription = subscriptions.data.find(
      sub => ["active", "trialing", "past_due"].includes(sub.status)
    ) || subscriptions.data[0] // Fallback to most recent

    if (!activeSubscription) {
      // No subscription found - user doesn't have Pro
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          is_pro: false,
          subscription_status: null,
          stripe_subscription_id: null,
        })
        .eq("id", userId)

      return new Response(
        JSON.stringify({ 
          hasSubscription: false,
          isPro: false,
          synced: !updateError
        }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 200,
        }
      )
    }

    // Update database with subscription info
    const status = activeSubscription.status
    const currentPeriodEnd = new Date(activeSubscription.current_period_end * 1000)
    const isPro = ["active", "trialing", "past_due"].includes(status)

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        stripe_customer_id: customerId, // Ensure customer ID is always set
        stripe_subscription_id: activeSubscription.id,
        subscription_status: status,
        subscription_current_period_end: currentPeriodEnd.toISOString(),
        is_pro: isPro,
      })
      .eq("id", userId)

    if (updateError) {
      console.error("❌ Error updating profile:", updateError)
      return new Response(
        JSON.stringify({ 
          error: "Failed to update profile",
          hasSubscription: true,
          isPro,
          status,
        }),
        {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
          status: 500,
        }
      )
    }

    console.log("✅ Synced subscription status:", {
      userId,
      username: profile.username,
      subscriptionId: activeSubscription.id,
      status,
      isPro,
    })

    return new Response(
      JSON.stringify({
        hasSubscription: true,
        isPro,
        status,
        subscriptionId: activeSubscription.id,
        periodEnd: currentPeriodEnd.toISOString(),
        synced: true,
      }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error("❌ Error syncing subscription:", error)
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to sync subscription status"
      }),
      {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 500,
      }
    )
  }
})

