import { env } from './env';
import { supabase } from './supabase';

export class InappropriateMediaError extends Error {
  readonly code = 'INAPPROPRIATE_CONTENT' as const;
  readonly reason?: string;

  constructor(message = 'This media was blocked because it looks inappropriate.', reason?: string) {
    super(message);
    this.name = 'InappropriateMediaError';
    this.reason = reason;
  }
}

export type MediaModerationResult = {
  safe: boolean;
  reason?: string | null;
  scores?: Record<string, number>;
  mediaType?: 'image' | 'video';
  skipped?: boolean;
  skipReason?: string | null;
};

function getSupabaseUrl(): string {
  return (env.supabaseUrl || '').replace(/\/$/, '');
}

function isUsageLimitPayload(payload: any): boolean {
  const type = String(payload?.error?.type || payload?.skipReason || '').toLowerCase();
  if (type === 'usage_limit') return true;
  if (payload?.skipped === true && payload?.skipReason === 'usage_limit') return true;

  const message = String(payload?.error || payload?.error?.message || payload?.message || '').toLowerCase();
  if (!message) return false;
  return (
    message.includes('usage_limit') ||
    message.includes('usage limit') ||
    message.includes('quota') ||
    message.includes('monthly limit') ||
    message.includes('daily limit')
  );
}

/**
 * Runs Sightengine moderation via the moderate-media edge function.
 * Throws InappropriateMediaError when content should be blocked.
 * If Sightengine quota/limit is hit, allows the upload through (fail-open).
 */
export async function assertMediaIsSafe(
  url: string,
  mediaType?: 'image' | 'video'
): Promise<MediaModerationResult> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Please sign in again to upload media.');
  }

  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) {
    throw new Error('Supabase URL is not configured.');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/moderate-media`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ url, mediaType }),
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  // Quota / plan cap: allow upload (moderation unavailable, not unsafe content).
  if (isUsageLimitPayload(payload) || (response.ok && payload?.skipped === true)) {
    if (__DEV__) {
      console.warn('Media moderation skipped (Sightengine usage limit) — allowing upload');
    }
    return {
      safe: true,
      skipped: true,
      skipReason: 'usage_limit',
      reason: null,
      mediaType: payload?.mediaType,
    };
  }

  if (!response.ok) {
    throw new Error(payload?.error || 'Could not verify this media. Please try again.');
  }

  if (payload?.safe === false) {
    throw new InappropriateMediaError(
      'This upload was blocked because it appears to contain inappropriate content.',
      payload?.reason ?? undefined
    );
  }

  return {
    safe: true,
    reason: payload?.reason ?? null,
    scores: payload?.scores,
    mediaType: payload?.mediaType,
    skipped: payload?.skipped === true,
    skipReason: payload?.skipReason ?? null,
  };
}

export function isInappropriateMediaError(error: unknown): error is InappropriateMediaError {
  return (
    error instanceof InappropriateMediaError ||
    (!!error &&
      typeof error === 'object' &&
      (error as any).code === 'INAPPROPRIATE_CONTENT')
  );
}

export const mediaModerationService = {
  assertMediaIsSafe,
  isInappropriateMediaError,
};
