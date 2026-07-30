// @ts-nocheck
// Hold escrow removed — wallet-only challenge joins.
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
      error: "Card hold escrow has been removed. Pay challenge entry from your wallet (top up if needed).",
      deprecated: true,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 410,
    }
  )
})
