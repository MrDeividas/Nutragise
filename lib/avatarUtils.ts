import { supabase } from './supabase';

/** Turn a stored avatar path or URL into a loadable Image URI. */
export function normalizeAvatarUrl(url?: string | null): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  const { data } = supabase.storage.from('users').getPublicUrl(trimmed);
  return data?.publicUrl || null;
}

type ProfileLike = {
  id: string;
  avatar_url?: string | null;
  [key: string]: any;
};

/**
 * Fill missing profile avatars from the users table (common desync),
 * normalize URLs, and optionally write the fix back to profiles.
 */
export async function enrichProfilesWithAvatars<T extends ProfileLike>(
  profiles: T[],
  opts?: { syncToProfiles?: boolean }
): Promise<T[]> {
  if (!profiles.length) return profiles;

  const missingIds = profiles
    .filter((p) => !normalizeAvatarUrl(p.avatar_url))
    .map((p) => p.id);

  const userAvatarMap = new Map<string, string>();

  if (missingIds.length > 0) {
    const { data: usersRows } = await supabase
      .from('users')
      .select('id, avatar_url')
      .in('id', missingIds);

    usersRows?.forEach((row) => {
      const url = normalizeAvatarUrl(row.avatar_url);
      if (url) userAvatarMap.set(row.id, url);
    });

    if (opts?.syncToProfiles !== false && userAvatarMap.size > 0) {
      await Promise.all(
        [...userAvatarMap.entries()].map(([id, avatar_url]) =>
          supabase.from('profiles').update({ avatar_url }).eq('id', id)
        )
      );
    }
  }

  return profiles.map((p) => {
    const fromProfile = normalizeAvatarUrl(p.avatar_url);
    const fromUsers = userAvatarMap.get(p.id) || null;
    return {
      ...p,
      avatar_url: fromProfile || fromUsers || null,
    };
  });
}
