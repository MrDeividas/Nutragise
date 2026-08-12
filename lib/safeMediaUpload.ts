import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';
import {
  assertMediaBase64IsSafe,
  assertMediaIsSafe,
  InappropriateMediaError,
  isInappropriateMediaError,
  isModerationUnavailableError,
} from './mediaModerationService';

export {
  InappropriateMediaError,
  isInappropriateMediaError,
  isModerationUnavailableError,
};

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

/** Keep base64 payloads under Edge Function / Sightengine practical limits. */
const MAX_PRECHECK_BYTES = 4.5 * 1024 * 1024;

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

/** Returns true when Sightengine already approved the local image bytes. */
async function precheckLocalImage(uri: string, contentType: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) {
    throw new Error('Could not read the selected media file.');
  }
  if (typeof info.size === 'number' && info.size > MAX_PRECHECK_BYTES) {
    return false;
  }

  const mediaBase64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64',
  });
  if (!mediaBase64) {
    throw new Error('Could not read the selected media file.');
  }
  await assertMediaBase64IsSafe(mediaBase64, {
    mediaType: 'image',
    contentType,
  });
  return true;
}

/**
 * Upload local media to the `users` bucket only after moderation when possible.
 * Images are pre-checked via base64 so unsafe content never becomes public.
 * Videos (or oversized images) upload then moderate, and are deleted if unsafe/unavailable.
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

  let imagePrechecked = false;
  if (kind === 'image') {
    try {
      imagePrechecked = await precheckLocalImage(uri, contentType);
    } catch (error) {
      if (isInappropriateMediaError(error) || isModerationUnavailableError(error)) {
        throw error;
      }
      if (__DEV__) {
        console.warn('Local media pre-check skipped:', error);
      }
      imagePrechecked = false;
    }
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

  // Always moderate after upload unless this image already passed a base64 pre-check.
  if (kind === 'video' || !imagePrechecked) {
    try {
      await assertMediaIsSafe(publicUrl, kind);
      return publicUrl;
    } catch (moderationError) {
      await removeUploadedFile(uploadedPath);
      throw moderationError;
    }
  }

  return publicUrl;
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
  if (isModerationUnavailableError(error)) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Upload failed. Please try again.';
}
