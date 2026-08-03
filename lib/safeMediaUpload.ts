import { supabase } from './supabase';
import {
  assertMediaIsSafe,
  InappropriateMediaError,
  isInappropriateMediaError,
} from './mediaModerationService';

export { InappropriateMediaError, isInappropriateMediaError };

export type SafeUploadOptions = {
  /** Local file:// / content:// URI, or already-remote https URL */
  uri: string;
  /** Storage path inside the `users` bucket */
  path: string;
  contentType?: string;
  fileName?: string;
  upsert?: boolean;
  mediaType?: 'image' | 'video';
};

function guessMediaType(uri: string, contentType?: string, explicit?: 'image' | 'video'): 'image' | 'video' {
  if (explicit) return explicit;
  if (contentType?.startsWith('video/')) return 'video';
  if (/\.(mp4|mov|m4v|webm|avi)(\?|$)/i.test(uri)) return 'video';
  return 'image';
}

function storagePathFromPublicUrl(publicUrl: string): string | null {
  const marker = '/storage/v1/object/public/users/';
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

async function removeUploadedFile(path: string | null | undefined) {
  if (!path) return;
  try {
    await supabase.storage.from('users').remove([path]);
  } catch (error) {
    console.warn('Failed to remove rejected media:', error);
  }
}

/**
 * Upload local media to the `users` bucket, run Sightengine moderation,
 * and delete the file if it fails the check. Returns the public URL.
 *
 * If `uri` is already an https URL, skips upload and only moderates.
 */
export async function uploadMediaSafely(options: SafeUploadOptions): Promise<string> {
  const {
    uri,
    path,
    contentType = 'image/jpeg',
    fileName,
    upsert = false,
    mediaType,
  } = options;

  const kind = guessMediaType(uri, contentType, mediaType);
  const isRemote = /^https?:\/\//i.test(uri);

  if (isRemote) {
    await assertMediaIsSafe(uri, kind);
    return uri;
  }

  const name =
    fileName ||
    path.split('/').pop() ||
    `upload_${Date.now()}.${kind === 'video' ? 'mp4' : 'jpg'}`;

  const formData = new FormData();
  formData.append('file', {
    uri,
    type: contentType,
    name,
  } as any);

  const { data, error } = await supabase.storage.from('users').upload(path, formData, {
    contentType,
    upsert,
  });

  if (error) {
    throw new Error(error.message || 'Upload failed');
  }

  const uploadedPath = data.path;
  const { data: urlData } = supabase.storage.from('users').getPublicUrl(uploadedPath);
  const publicUrl = urlData.publicUrl;

  try {
    await assertMediaIsSafe(publicUrl, kind);
    return publicUrl;
  } catch (moderationError) {
    // Only remove when content was judged unsafe. Quota / other errors should
    // not leave the user with a failed upload after a successful storage write
    // if we're fail-opening — but quota is handled inside assertMediaIsSafe.
    if (isInappropriateMediaError(moderationError)) {
      await removeUploadedFile(uploadedPath);
    }
    throw moderationError;
  }
}

/**
 * Moderate an already-public URL. Optionally delete it from storage if rejected.
 */
export async function moderateExistingMediaUrl(
  publicUrl: string,
  options?: { deleteIfUnsafe?: boolean; mediaType?: 'image' | 'video' }
): Promise<void> {
  try {
    await assertMediaIsSafe(publicUrl, options?.mediaType);
  } catch (error) {
    if (options?.deleteIfUnsafe !== false && isInappropriateMediaError(error)) {
      await removeUploadedFile(storagePathFromPublicUrl(publicUrl));
    }
    throw error;
  }
}

export function moderationAlertMessage(error: unknown): string {
  if (isInappropriateMediaError(error)) {
    return 'This media was blocked because it appears to contain inappropriate content. Please choose a different photo or video.';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Upload failed. Please try again.';
}
