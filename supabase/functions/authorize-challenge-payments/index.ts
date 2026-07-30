// @ts-nocheck
// Hold escrow removed — no longer authorizes Stripe manual-capture holds.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

  return new Response(
    JSON.stringify({
      success: true,
      deprecated: true,
      message: "Hold authorization disabled. Challenges use wallet payments only.",
      authorized: 0,
      skipped: 0,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 200,
    }
  )
})
