// @ts-nocheck - Deno runtime (Supabase Edge Functions)
// Moderates user-uploaded images/videos via Sightengine.
// Secrets: SIGHTENGINE_API_USER, SIGHTENGINE_API_SECRET
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// nudity-2.1 only keeps free-tier usage at 1 op/image. Add gore-2.0,weapon later if needed.
const IMAGE_MODELS = 'nudity-2.1';
const VIDEO_MODELS = 'nudity-2.1';
const MAX_BASE64_CHARS = 6_500_000;

type MediaKind = 'image' | 'video';

function isVideoUrl(url: string, mediaType?: string): boolean {
  if (mediaType === 'video') return true;
  if (mediaType === 'image') return false;
  return /\.(mp4|mov|m4v|webm|avi)(\?|$)/i.test(url);
}

function maxScore(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).reduce<number>((max, v) => {
      if (typeof v === 'number' && Number.isFinite(v)) return Math.max(max, v);
      return max;
    }, 0);
  }
  return 0;
}

function evaluateSafety(result: Record<string, any>): {
  safe: boolean;
  reason?: string;
  scores: Record<string, number>;
} {
  const nudity = result?.nudity ?? {};
  const scores = {
    sexual_activity: Number(nudity.sexual_activity ?? 0),
    sexual_display: Number(nudity.sexual_display ?? 0),
    erotica: Number(nudity.erotica ?? 0),
    very_suggestive: Number(nudity.very_suggestive ?? 0),
    sextoy: Number(nudity.sextoy ?? 0),
    visibly_undressed: Number(nudity.visibly_undressed ?? 0),
    none: Number(nudity.none ?? 1),
    gore: maxScore(result?.gore),
    weapon: maxScore(result?.weapon),
  };

  // Fitness-friendly: allow gym/swimwear; block explicit sexual content, gore, weapons.
  if (scores.sexual_activity >= 0.4) {
    return { safe: false, reason: 'sexual_activity', scores };
  }
  if (scores.sexual_display >= 0.4) {
    return { safe: false, reason: 'sexual_display', scores };
  }
  if (scores.erotica >= 0.55) {
    return { safe: false, reason: 'erotica', scores };
  }
  if (scores.sextoy >= 0.45) {
    return { safe: false, reason: 'sextoy', scores };
  }
  if (scores.visibly_undressed >= 0.7 && scores.erotica >= 0.35) {
    return { safe: false, reason: 'visibly_undressed', scores };
  }
  if (scores.gore >= 0.7) {
    return { safe: false, reason: 'gore', scores };
  }
  if (scores.weapon >= 0.85) {
    return { safe: false, reason: 'weapon', scores };
  }

  return { safe: true, scores };
}

function extractFrameResults(videoPayload: Record<string, any>): Record<string, any>[] {
  const frames =
    videoPayload?.data?.frames ??
    videoPayload?.frames ??
    videoPayload?.data?.summary?.frames ??
    [];
  return Array.isArray(frames) ? frames : [];
}

/** Free-tier daily/monthly quota (and similar plan caps). Uploads must fail-closed. */
class SightengineUsageLimitError extends Error {
  constructor(message = 'Sightengine usage limit exceeded') {
    super(message);
    this.name = 'SightengineUsageLimitError';
  }
}

function isUsageLimitPayload(payload: Record<string, any> | null | undefined): boolean {
  const type = String(payload?.error?.type || '').toLowerCase();
  if (type === 'usage_limit') return true;

  const message = String(payload?.error?.message || payload?.message || '').toLowerCase();
  if (!message) return false;
  if (message.includes('usage_limit')) return true;
  if (message.includes('usage limit')) return true;
  if (message.includes('quota')) return true;
  if (message.includes('monthly limit') || message.includes('daily limit')) return true;
  if (type === 'plan_error' && message.includes('limit')) return true;
  return false;
}

function decodeBase64ToBytes(mediaBase64: string): Uint8Array {
  const cleaned = mediaBase64.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function checkImageUrl(url: string, apiUser: string, apiSecret: string) {
  const endpoint = new URL('https://api.sightengine.com/1.0/check.json');
  endpoint.searchParams.set('url', url);
  endpoint.searchParams.set('models', IMAGE_MODELS);
  endpoint.searchParams.set('api_user', apiUser);
  endpoint.searchParams.set('api_secret', apiSecret);

  const response = await fetch(endpoint.toString(), { method: 'GET' });
  const payload = await response.json();
  if (!response.ok || payload?.status === 'failure') {
    if (isUsageLimitPayload(payload)) {
      throw new SightengineUsageLimitError(payload?.error?.message || 'Sightengine usage limit exceeded');
    }
    throw new Error(payload?.error?.message || 'Sightengine image check failed');
  }
  return evaluateSafety(payload);
}

async function checkImageBytes(
  bytes: Uint8Array,
  contentType: string,
  apiUser: string,
  apiSecret: string
) {
  const form = new FormData();
  const filename = contentType.includes('png')
    ? 'upload.png'
    : contentType.includes('webp')
      ? 'upload.webp'
      : 'upload.jpg';
  form.append('media', new Blob([bytes], { type: contentType || 'image/jpeg' }), filename);
  form.append('models', IMAGE_MODELS);
  form.append('api_user', apiUser);
  form.append('api_secret', apiSecret);

  const response = await fetch('https://api.sightengine.com/1.0/check.json', {
    method: 'POST',
    body: form,
  });
  const payload = await response.json();
  if (!response.ok || payload?.status === 'failure') {
    if (isUsageLimitPayload(payload)) {
      throw new SightengineUsageLimitError(payload?.error?.message || 'Sightengine usage limit exceeded');
    }
    throw new Error(payload?.error?.message || 'Sightengine image check failed');
  }
  return evaluateSafety(payload);
}

async function checkVideo(url: string, apiUser: string, apiSecret: string) {
  const form = new FormData();
  form.append('stream_url', url);
  form.append('models', VIDEO_MODELS);
  form.append('api_user', apiUser);
  form.append('api_secret', apiSecret);

  const response = await fetch('https://api.sightengine.com/1.0/video/check-sync.json', {
    method: 'POST',
    body: form,
  });
  const payload = await response.json();

  if (!response.ok || payload?.status === 'failure') {
    if (isUsageLimitPayload(payload)) {
      throw new SightengineUsageLimitError(payload?.error?.message || 'Sightengine usage limit exceeded');
    }
    console.warn('Video sync check failed, falling back to image check:', payload?.error);
    return checkImageUrl(url, apiUser, apiSecret);
  }

  const frames = extractFrameResults(payload);
  if (frames.length === 0) {
    return evaluateSafety(payload?.data ?? payload);
  }

  for (const frame of frames) {
    const decision = evaluateSafety(frame);
    if (!decision.safe) return decision;
  }
  return evaluateSafety(frames[0] ?? payload?.data ?? payload);
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiUser = Deno.env.get('SIGHTENGINE_API_USER');
    const apiSecret = Deno.env.get('SIGHTENGINE_API_SECRET');
    if (!apiUser || !apiSecret) {
      return new Response(
        JSON.stringify({
          error: 'Sightengine is not configured. Set SIGHTENGINE_API_USER and SIGHTENGINE_API_SECRET.',
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
    const mediaUrl = typeof body?.url === 'string' ? body.url.trim() : '';
    const mediaBase64 = typeof body?.mediaBase64 === 'string' ? body.mediaBase64 : '';
    const contentType =
      typeof body?.contentType === 'string' && body.contentType.trim()
        ? body.contentType.trim()
        : 'image/jpeg';
    const mediaType = (body?.mediaType as MediaKind | undefined) ?? undefined;

    if (!mediaUrl && !mediaBase64) {
      return new Response(JSON.stringify({ error: 'A valid media url or mediaBase64 is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (mediaBase64 && mediaBase64.length > MAX_BASE64_CHARS) {
      return new Response(JSON.stringify({ error: 'Media payload is too large to moderate' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 413,
      });
    }

    const kind: MediaKind = mediaBase64
      ? mediaType === 'video'
        ? 'video'
        : 'image'
      : isVideoUrl(mediaUrl, mediaType)
        ? 'video'
        : 'image';

    if (mediaBase64 && kind === 'video') {
      return new Response(
        JSON.stringify({ error: 'Video base64 moderation is not supported; upload then moderate by URL.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    try {
      const decision = mediaBase64
        ? await checkImageBytes(decodeBase64ToBytes(mediaBase64), contentType, apiUser, apiSecret)
        : kind === 'video'
          ? await checkVideo(mediaUrl, apiUser, apiSecret)
          : await checkImageUrl(mediaUrl, apiUser, apiSecret);

      return new Response(
        JSON.stringify({
          safe: decision.safe,
          reason: decision.reason ?? null,
          scores: decision.scores,
          mediaType: kind,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } catch (checkError) {
      // Fail closed: do not publish UGC when moderation cannot run.
      if (
        checkError instanceof SightengineUsageLimitError ||
        (checkError as any)?.name === 'SightengineUsageLimitError' ||
        isUsageLimitPayload({ error: { message: (checkError as Error)?.message } })
      ) {
        console.warn('Sightengine usage limit hit — blocking media:', checkError);
        return new Response(
          JSON.stringify({
            safe: false,
            skipped: true,
            skipReason: 'usage_limit',
            error: 'Media moderation is at capacity. Please try again later.',
            reason: 'usage_limit',
            mediaType: kind,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
        );
      }
      throw checkError;
    }
  } catch (error) {
    console.error('moderate-media error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Moderation failed',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
