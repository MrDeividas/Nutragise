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

export class ModerationUnavailableError extends Error {
  readonly code = 'MODERATION_UNAVAILABLE' as const;

  constructor(
    message = 'Media moderation is temporarily unavailable. Please try again later.'
  ) {
    super(message);
    this.name = 'ModerationUnavailableError';
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

async function getAccessToken(): Promise<string> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Please sign in again to upload media.');
  }
  return session.access_token;
}

async function postModerateMedia(body: Record<string, unknown>): Promise<MediaModerationResult> {
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) {
    throw new Error('Supabase URL is not configured.');
  }

  const accessToken = await getAccessToken();
  const response = await fetch(`${supabaseUrl}/functions/v1/moderate-media`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  // Fail closed: quota / skipped moderation must not publish UGC.
  if (isUsageLimitPayload(payload) || (response.ok && payload?.skipped === true)) {
    throw new ModerationUnavailableError(
      'Media moderation is at capacity right now. Please try uploading again shortly.'
    );
  }

  if (!response.ok) {
    if (response.status >= 500) {
      throw new ModerationUnavailableError(
        payload?.error || 'Media moderation is temporarily unavailable. Please try again later.'
      );
    }
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
    skipped: false,
    skipReason: null,
  };
}

/**
 * Runs Sightengine moderation via the moderate-media edge function for a public URL.
 * Throws InappropriateMediaError when content should be blocked.
 * Throws ModerationUnavailableError when quota/service is down (fail-closed).
 */
export async function assertMediaIsSafe(
  url: string,
  mediaType?: 'image' | 'video'
): Promise<MediaModerationResult> {
  return postModerateMedia({ url, mediaType });
}

/**
 * Moderates local media bytes (base64) before any public upload.
 */
export async function assertMediaBase64IsSafe(
  mediaBase64: string,
  options?: { mediaType?: 'image' | 'video'; contentType?: string }
): Promise<MediaModerationResult> {
  return postModerateMedia({
    mediaBase64,
    mediaType: options?.mediaType,
    contentType: options?.contentType,
  });
}

export function isInappropriateMediaError(error: unknown): error is InappropriateMediaError {
  return (
    error instanceof InappropriateMediaError ||
    (!!error &&
      typeof error === 'object' &&
      (error as any).code === 'INAPPROPRIATE_CONTENT')
  );
}

export function isModerationUnavailableError(error: unknown): error is ModerationUnavailableError {
  return (
    error instanceof ModerationUnavailableError ||
    (!!error &&
      typeof error === 'object' &&
      (error as any).code === 'MODERATION_UNAVAILABLE')
  );
}

export const mediaModerationService = {
  assertMediaIsSafe,
  assertMediaBase64IsSafe,
  isInappropriateMediaError,
  isModerationUnavailableError,
};
