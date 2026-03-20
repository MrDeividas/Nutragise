// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Sends a push notification to one or more users via the Expo Push API.
// Called server-side so the push_tokens table stays off the client.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { userId, title, body, data = {} } = await req.json();

    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Look up the recipient's push token
    const { data: tokenRow, error: tokenError } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId)
      .maybeSingle();

    if (tokenError) {
      console.error('Error fetching push token:', tokenError);
      return new Response(
        JSON.stringify({ success: false, reason: 'token_lookup_failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!tokenRow?.token) {
      // User hasn't granted push permission yet — silently skip
      return new Response(
        JSON.stringify({ success: false, reason: 'no_token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = tokenRow.token;

    // Only send to valid Expo push tokens
    if (!token.startsWith('ExponentPushToken[')) {
      return new Response(
        JSON.stringify({ success: false, reason: 'invalid_token_format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send via Expo Push API
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
      }),
    });

    const result = await response.json();

    // Check for Expo-level errors (e.g. DeviceNotRegistered)
    const ticketData = result?.data;
    if (ticketData?.status === 'error') {
      console.warn(`⚠️ Expo push error for user ${userId}:`, ticketData.message);

      // If the device token is no longer valid, remove it from DB
      if (ticketData.details?.error === 'DeviceNotRegistered') {
        await supabase.from('push_tokens').delete().eq('user_id', userId);
        console.log(`🗑️ Removed stale push token for user ${userId}`);
      }

      return new Response(
        JSON.stringify({ success: false, reason: ticketData.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Push sent to user ${userId}: "${title}"`);

    return new Response(
      JSON.stringify({ success: true, ticketId: ticketData?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
