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
  'reduce social media',
  '100 press ups',
  '100 squats',
  'mobility every day',
  'deep work',
];

export const PRO_ONLY_CHALLENGE_DISPLAY_ORDER: readonly string[] = [
  'Daily Sweat',
  '6AM Club',
  'Reduce Social Media',
  '100 Press Ups',
  '100 Squats',
  'Mobility Every Day',
  'Deep Work',
];

/** True when title matches the curated Pro Challenges list. */
export function isProOnlyChallengeTitle(title: string): boolean {
  const key = stripTrailingChallengeWord(title).toLowerCase();
  return PRO_ONLY_CHALLENGE_DISPLAY_ORDER_NORMALIZED.includes(key);
}

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
 * Steps section on Compete — everyone can join; custom fees / durations / start weekdays.
 * startWeekday: 0=Sun … 1=Mon … 5=Fri … 6=Sat (JS getDay).
 */
export type StepChallengeConfig = {
  /** Canonical display / DB title */
  title: string;
  entryFee: number;
  durationDays: number;
  startWeekday: number;
};

const STEP_CHALLENGE_CONFIGS: readonly StepChallengeConfig[] = [
  { title: '15K Steps Daily', entryFee: 30, durationDays: 12, startWeekday: 0 },
  { title: '10K Steps Daily', entryFee: 35, durationDays: 15, startWeekday: 3 },
  { title: '12K Steps Daily', entryFee: 30, durationDays: 10, startWeekday: 5 },
  { title: '8K Steps Daily', entryFee: 40, durationDays: 12, startWeekday: 1 },
];

const STEP_CHALLENGE_KEYS = new Set(
  STEP_CHALLENGE_CONFIGS.flatMap((c) => {
    const base = stripTrailingChallengeWord(c.title).toLowerCase();
    // also match "8k steps" without Daily
    const withoutDaily = base.replace(/\s+daily$/, '');
    return [base, withoutDaily];
  })
);

export function isStepsChallengeTitle(title: string): boolean {
  const key = stripTrailingChallengeWord(title).toLowerCase();
  const withoutDaily = key.replace(/\s+daily$/, '');
  return STEP_CHALLENGE_KEYS.has(key) || STEP_CHALLENGE_KEYS.has(withoutDaily);
}

export function getStepChallengeConfig(title: string): StepChallengeConfig | null {
  const key = stripTrailingChallengeWord(title).toLowerCase();
  const withoutDaily = key.replace(/\s+daily$/, '');
  return (
    STEP_CHALLENGE_CONFIGS.find((c) => {
      const ck = stripTrailingChallengeWord(c.title).toLowerCase();
      return ck === key || ck.replace(/\s+daily$/, '') === withoutDaily;
    }) ?? null
  );
}

/** Official entry fee for step challenges (overrides default £15/£25). */
export function getStepChallengeEntryFee(title: string): number | null {
  return getStepChallengeConfig(title)?.entryFee ?? null;
}

export function sortStepsChallengesByDisplayOrder<T extends { title: string }>(
  challenges: T[]
): T[] {
  return [...challenges].sort((a, b) => {
    const aCfg = getStepChallengeConfig(a.title);
    const bCfg = getStepChallengeConfig(b.title);
    const aRank = aCfg
      ? STEP_CHALLENGE_CONFIGS.findIndex((c) => c.title === aCfg.title)
      : 999;
    const bRank = bCfg
      ? STEP_CHALLENGE_CONFIGS.findIndex((c) => c.title === bCfg.title)
      : 999;
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
