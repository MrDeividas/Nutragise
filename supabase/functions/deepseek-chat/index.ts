// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Proxies DeepSeek chat so the API key never ships in the mobile app.
// Secret: DEEPSEEK_API_KEY
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek-chat';
const MAX_MESSAGES = 20;
const MAX_CONTENT_CHARS = 12000;

type ChatMessage = { role: string; content: string };

function sanitizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMessage[] = [];
  for (const item of raw.slice(0, MAX_MESSAGES)) {
    if (!item || typeof item !== 'object') continue;
    const role = String((item as any).role || '').trim();
    const content = String((item as any).content || '').trim();
    if (!content) continue;
    if (role !== 'system' && role !== 'user' && role !== 'assistant') continue;
    out.push({
      role,
      content: content.slice(0, MAX_CONTENT_CHARS),
    });
  }
  return out;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('DEEPSEEK_API_KEY');
    if (!apiKey || apiKey.includes('your_') || apiKey === 'changeme') {
      return new Response(
        JSON.stringify({
          error:
            'DeepSeek is not configured. Set DEEPSEEK_API_KEY as a Supabase Edge Function secret.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const body = await req.json();
    const messages = sanitizeMessages(body?.messages);
    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const maxTokens = Math.min(
      Math.max(Number(body?.max_tokens) || 350, 64),
      800
    );
    const temperature = Math.min(Math.max(Number(body?.temperature) || 0.4, 0), 1.2);

    const upstream = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature,
        frequency_penalty: 0.6,
        presence_penalty: 0.3,
      }),
    });

    const payloadText = await upstream.text();
    let payload: any = null;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      payload = null;
    }

    if (!upstream.ok) {
      console.error('DeepSeek upstream error:', upstream.status, payloadText.slice(0, 300));
      return new Response(
        JSON.stringify({
          error: payload?.error?.message || `DeepSeek request failed (${upstream.status})`,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: upstream.status >= 500 ? 502 : 400,
        }
      );
    }

    const content = payload?.choices?.[0]?.message?.content || '';
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('deepseek-chat error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'DeepSeek proxy failed',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
