/**
 * Username / onboarding helpers — existing accounts must not be forced through
 * ProfileSetup when they already chose a real username.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * True when the username looks like a user-chosen handle (not a placeholder).
 * Placeholders: empty, auth user id, or a raw UUID. Email local-part is allowed —
 * many users legitimately pick that as their username.
 */
export function isRealProfileUsername(
  username: string | null | undefined,
  userId: string | null | undefined
): boolean {
  const u = (username || '').trim();
  if (!u || !userId) return false;
  if (u === userId) return false;
  if (UUID_RE.test(u)) return false;
  return true;
}
