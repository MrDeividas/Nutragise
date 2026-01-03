// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Handles Stripe webhook events for subscription management
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req: Request) => {
  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  const signature = req.headers.get("stripe-signature")
  
  if (!signature) {
    console.error("❌ No Stripe signature found")
    return new Response(JSON.stringify({ error: "No signature" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!webhookSecret) {
    console.error("❌ STRIPE_WEBHOOK_SECRET not configured")
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    // Get raw body for signature verification
    const body = await req.text()

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message)
      return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log("✅ Received webhook event:", event.type)

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        await handleInvoicePaid(invoice)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error: any) {
    console.error("❌ Error processing webhook:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
})

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log("📝 Handling subscription update:", subscription.id)

  const customerId = subscription.customer as string
  const subscriptionId = subscription.id
  const status = subscription.status
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

  // Determine if user should have Pro access
  // Pro access if status is: active, trialing, or past_due (give grace period)
  const isPro = ["active", "trialing", "past_due"].includes(status)

  // Find user by Stripe customer ID
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("stripe_customer_id", customerId)
    .single()

  if (findError || !profile) {
    console.error("❌ Could not find user with customer ID:", customerId)
    return
  }

  // Update profile with subscription info
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      stripe_subscription_id: subscriptionId,
      subscription_status: status,
      subscription_current_period_end: currentPeriodEnd.toISOString(),
      is_pro: isPro,
    })
    .eq("id", profile.id)

  if (updateError) {
    console.error("❌ Error updating profile:", updateError)
    throw updateError
  }

  console.log("✅ Updated user Pro status:", {
    userId: profile.id,
    username: profile.username,
    isPro,
    status,
    periodEnd: currentPeriodEnd,
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("🗑️ Handling subscription deletion:", subscription.id)

  const customerId = subscription.customer as string
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000)
  const now = new Date()

  // User keeps Pro until end of billing period
  const isPro = currentPeriodEnd > now

  // Find user by Stripe customer ID
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("stripe_customer_id", customerId)
    .single()

  if (findError || !profile) {
    console.error("❌ Could not find user with customer ID:", customerId)
    return
  }

  // Update profile - mark as canceled but keep Pro until period end
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      subscription_status: "canceled",
      subscription_current_period_end: currentPeriodEnd.toISOString(),
      is_pro: isPro,
    })
    .eq("id", profile.id)

  if (updateError) {
    console.error("❌ Error updating profile:", updateError)
    throw updateError
  }

  console.log("✅ Subscription canceled:", {
    userId: profile.id,
    username: profile.username,
    keepProUntil: currentPeriodEnd,
    stillHasPro: isPro,
  })
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log("💰 Invoice paid:", invoice.id)

  // When invoice is paid, subscription is updated automatically
  // Stripe will send subscription.updated event, so we don't need to do anything here
  // Just log for tracking
  console.log("✅ Payment successful for customer:", invoice.customer)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log("❌ Payment failed:", invoice.id)

  const customerId = invoice.customer as string

  // Find user by Stripe customer ID
  const { data: profile, error: findError } = await supabase
    .from("profiles")
    .select("id, username, email")
    .eq("stripe_customer_id", customerId)
    .single()

  if (findError || !profile) {
    console.error("❌ Could not find user with customer ID:", customerId)
    return
  }

  // Update subscription status to past_due
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      subscription_status: "past_due",
    })
    .eq("id", profile.id)

  if (updateError) {
    console.error("❌ Error updating profile:", updateError)
  }

  console.log("⚠️ Payment failed for user:", {
    userId: profile.id,
    username: profile.username,
    email: profile.email,
  })

  // TODO: Send email notification to user about failed payment
  // You can implement email sending here
}
