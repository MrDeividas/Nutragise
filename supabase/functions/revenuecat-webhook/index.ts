// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Handles RevenueCat webhook events for Pro subscription management.
// Source of truth for `profiles.is_pro`, `subscription_status`,
// `subscription_current_period_end`, `subscription_source` and `revenuecat_app_user_id`.
//
// Configure in RevenueCat dashboard:
//   Webhook URL  : https://<project-ref>.supabase.co/functions/v1/revenuecat-webhook
//   Authorization: Bearer <REVENUECAT_WEBHOOK_AUTH>  (any random secret you also set in Supabase secrets)
//
// Required Supabase Edge secrets:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   REVENUECAT_WEBHOOK_AUTH  (shared secret, verified against the Authorization header)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const expectedAuth = Deno.env.get("REVENUECAT_WEBHOOK_AUTH") || ""
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Entitlement identifier configured in RevenueCat dashboard.
const PRO_ENTITLEMENT = "pro"

// RevenueCat event types we care about. All other event types are logged and ignored.
const ENTITLEMENT_GRANTING_EVENTS = new Set([
  "INITIAL_PURCHASE",
  "RENEWAL",
  "PRODUCT_CHANGE",
  "UNCANCELLATION",
  "TRANSFER",
])

const ENTITLEMENT_REVOKING_EVENTS = new Set([
  "CANCELLATION",
  "EXPIRATION",
  "SUBSCRIPTION_PAUSED",
])

const BILLING_ISSUE_EVENTS = new Set(["BILLING_ISSUE"])

interface RevenueCatEvent {
  type: string
  app_user_id?: string
  original_app_user_id?: string
  aliases?: string[]
  product_id?: string
  period_type?: string
  purchased_at_ms?: number
  expiration_at_ms?: number
  store?: string // "APP_STORE" | "PLAY_STORE" | "STRIPE" | ...
  environment?: string
  entitlement_id?: string | null
  entitlement_ids?: string[]
  transferred_to?: string[]
  transferred_from?: string[]
}

interface RevenueCatPayload {
  api_version?: string
  event?: RevenueCatEvent
}

function storeToSource(store?: string): string | null {
  switch (store) {
    case "APP_STORE":
    case "MAC_APP_STORE":
      return "apple"
    case "PLAY_STORE":
      return "google"
    case "STRIPE":
      return "stripe"
    default:
      return null
  }
}

function eventTouchesPro(event: RevenueCatEvent): boolean {
  if (event.entitlement_id === PRO_ENTITLEMENT) return true
  if (Array.isArray(event.entitlement_ids) && event.entitlement_ids.includes(PRO_ENTITLEMENT)) return true
  return false
}

async function findProfileForEvent(event: RevenueCatEvent) {
  const candidateIds = [
    event.app_user_id,
    event.original_app_user_id,
    ...(event.aliases || []),
  ].filter((value): value is string => typeof value === "string" && value.length > 0)

  for (const candidate of candidateIds) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, is_pro, subscription_source, revenuecat_app_user_id")
      .or(`id.eq.${candidate},revenuecat_app_user_id.eq.${candidate}`)
      .maybeSingle()

    if (!error && data) return data
  }

  return null
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!expectedAuth) {
    console.error("REVENUECAT_WEBHOOK_AUTH not configured")
    return new Response(JSON.stringify({ error: "Webhook auth not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }

  const authHeader = req.headers.get("authorization") || ""
  if (authHeader !== `Bearer ${expectedAuth}` && authHeader !== expectedAuth) {
    console.error("Invalid Authorization header")
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  let payload: RevenueCatPayload
  try {
    payload = await req.json()
  } catch (err) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const event = payload.event
  if (!event || !event.type) {
    return new Response(JSON.stringify({ error: "Missing event" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  console.log("RevenueCat event:", event.type, {
    appUserId: event.app_user_id,
    store: event.store,
    entitlementId: event.entitlement_id,
  })

  if (!eventTouchesPro(event)) {
    console.log("Event does not affect the 'pro' entitlement; ignoring")
    return new Response(JSON.stringify({ received: true, ignored: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const profile = await findProfileForEvent(event)
    if (!profile) {
      console.error("Could not locate profile for event", {
        appUserId: event.app_user_id,
        originalAppUserId: event.original_app_user_id,
      })
      return new Response(JSON.stringify({ received: true, matched: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    const source = storeToSource(event.store) ?? profile.subscription_source ?? null
    const periodEnd = event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null

    const update: Record<string, unknown> = {
      revenuecat_app_user_id: event.app_user_id || event.original_app_user_id || profile.revenuecat_app_user_id,
    }

    if (ENTITLEMENT_GRANTING_EVENTS.has(event.type)) {
      update.is_pro = true
      update.subscription_status = "active"
      update.subscription_source = source
      if (periodEnd) update.subscription_current_period_end = periodEnd
    } else if (ENTITLEMENT_REVOKING_EVENTS.has(event.type)) {
      // CANCELLATION leaves the user Pro until expiration; EXPIRATION removes Pro now.
      const now = Date.now()
      const stillEntitled = event.expiration_at_ms ? event.expiration_at_ms > now : false
      update.is_pro = stillEntitled
      update.subscription_status =
        event.type === "EXPIRATION" || event.type === "SUBSCRIPTION_PAUSED" ? "expired" : "canceled"
      if (periodEnd) update.subscription_current_period_end = periodEnd
      if (!stillEntitled) update.subscription_source = null
    } else if (BILLING_ISSUE_EVENTS.has(event.type)) {
      // Keep Pro active during grace period; flag status only.
      update.subscription_status = "past_due"
      update.subscription_source = source
      if (periodEnd) update.subscription_current_period_end = periodEnd
    } else {
      console.log("Unhandled event type", event.type)
      return new Response(JSON.stringify({ received: true, unhandled: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update(update)
      .eq("id", profile.id)

    if (updateError) {
      console.error("Failed to update profile", updateError)
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log("Profile updated:", {
      userId: profile.id,
      username: profile.username,
      eventType: event.type,
      update,
    })

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err: any) {
    console.error("Error processing RevenueCat webhook", err)
    return new Response(JSON.stringify({ error: err?.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})
