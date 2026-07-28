/**
 * Strips a trailing " Challenge" / " challenge" so we match both DB styles:
 * - New: "Gym"
 * - Legacy: "Gym Challenge"
 */
export function stripTrailingChallengeWord(title: string): string {
  return title.replace(/\s+challenge$/i, '').trim();
}

/** Legacy daily challenge: drop emoji + optional "Challenge" suffix, then match. */
function normalizedDailySmileBase(title: string): string {
  const noEmoji = title
    .replace(/\uFE0F/g, '')
    .replace(/😊/gu, '')
    .trim();
  return stripTrailingChallengeWord(noEmoji).replace(/\s+/g, ' ').trim();
}

/**
 * User-visible challenge title (DB may still hold legacy names until migrations run).
 */
function normalizedTitleKey(title: string): string {
  return stripTrailingChallengeWord(title.trim()).replace(/\s+/g, ' ').trim().toLowerCase();
}

export function getChallengeDisplayTitle(title: string): string {
  if (/^daily\s+smile$/i.test(normalizedDailySmileBase(title))) {
    return 'Be Happy';
  }
  if (normalizedTitleKey(title) === 'daily walk proof') {
    return 'Spread Positivity';
  }
  return title.trim();
}

/**
 * Only Spread Positivity may use gallery/screenshot proof; all other challenges require a live camera photo.
 */
export function challengeAllowsGalleryProofUpload(title: string): boolean {
  const display = getChallengeDisplayTitle(title);
  return stripTrailingChallengeWord(display).replace(/\s+/g, ' ').trim().toLowerCase() === 'spread positivity';
}

/** Normalize challenge title for hero-image lookup (case-insensitive; common DB typo "warriror"). */
export function normalizeHeroRegistryKey(label: string): string {
  return stripTrailingChallengeWord(label.trim())
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/warriror/g, 'warrior');
}

export function normalizedChallengeHeroLookupKey(title: string): string {
  return normalizeHeroRegistryKey(getChallengeDisplayTitle(title));
}

/** Normalized titles we no longer show in app lists (curated challenge retired). */
const RETIRED_CHALLENGE_NORMALIZED_TITLES = new Set(['healthy choice']);

export function isRetiredPublicChallengeTitle(title: string): boolean {
  const normalized = stripTrailingChallengeWord(title.trim())
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  return RETIRED_CHALLENGE_NORMALIZED_TITLES.has(normalized);
}

/**
 * Order for Core Habits section on the Challenge (Compete) screen.
 * Gym → Focus → Exercise → Meditation → Sleep first, then the rest.
 */
export const CORE_HABIT_CHALLENGE_DISPLAY_ORDER: readonly string[] = [
  'Gym',
  'Focus',
  'Exercise',
  'Meditation',
  'Sleep',
  'Goal Update',
  'Microlearn',
  'Reflection',
  'Water',
  'Cold Shower',
  'Screen Time',
];

export function sortCoreHabitChallengesByDisplayOrder<T extends { title: string }>(
  challenges: T[]
): T[] {
  const order = CORE_HABIT_CHALLENGE_DISPLAY_ORDER;
  return [...challenges].sort((a, b) => {
    const aKey = stripTrailingChallengeWord(a.title);
    const bKey = stripTrailingChallengeWord(b.title);
    const ai = order.indexOf(aKey);
    const bi = order.indexOf(bKey);
    const aRank = ai === -1 ? 999 : ai;
    const bRank = bi === -1 ? 999 : bi;
    if (aRank !== bRank) return aRank - bRank;
    return a.title.localeCompare(b.title);
  });
}

/**
 * Pro-only curated challenges on the Compete screen.
 * Normalized to lowercase for case-insensitive matching.
 */
const PRO_ONLY_CHALLENGE_DISPLAY_ORDER_NORMALIZED: readonly string[] = [
  'daily sweat',
  '6am club',
  '15k steps daily',
  '15k steps',
  'reduce social media',
  '100 press ups',
  '100 squats',
  'mobility every day',
  'deep work',
];

export const PRO_ONLY_CHALLENGE_DISPLAY_ORDER: readonly string[] = [
  'Daily Sweat',
  '6AM Club',
  '15k Steps Daily',
  'Reduce Social Media',
  '100 Press Ups',
  '100 Squats',
  'Mobility Every Day',
  'Deep Work',
];

export function sortProOnlyChallengesByDisplayOrder<T extends { title: string }>(
  challenges: T[]
): T[] {
  return [...challenges].sort((a, b) => {
    const aKey = stripTrailingChallengeWord(a.title).toLowerCase();
    const bKey = stripTrailingChallengeWord(b.title).toLowerCase();
    const ai = PRO_ONLY_CHALLENGE_DISPLAY_ORDER_NORMALIZED.indexOf(aKey);
    const bi = PRO_ONLY_CHALLENGE_DISPLAY_ORDER_NORMALIZED.indexOf(bKey);
    const aRank = ai === -1 ? 999 : ai;
    const bRank = bi === -1 ? 999 : bi;
    if (aRank !== bRank) return aRank - bRank;
    return a.title.localeCompare(b.title);
  });
}

/**
 * Curated Gym challenge: same hero key as `ChallengeCard` (`gym.png`), not `image_url`.
 */
export function isCuratedGymChallengeForCardHero(title: string, isUserCreated?: boolean): boolean {
  if (isUserCreated) return false;
  return normalizedChallengeHeroLookupKey(title) === normalizeHeroRegistryKey('Gym');
}
