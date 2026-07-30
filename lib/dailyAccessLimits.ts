import { supabase } from './supabase';

/** App-day boundary matches habit tracking (rolls at 04:00 local). */
export function getAppDayStart(now = new Date()): Date {
  const start = new Date(now);
  start.setHours(4, 0, 0, 0);
  if (now < start) {
    start.setDate(start.getDate() - 1);
  }
  return start;
}

export type DailyAccessProfile = {
  isPro: boolean;
  level: number;
};

/**
 * Daily new-session allowance for microlearns / meditations.
 * Pro = unlimited (null). Otherwise: L5+ → 3, L3–4 → 2, else → 1.
 */
export function getDailySessionLimit(level: number, isPro: boolean): number | null {
  if (isPro) return null;
  const safeLevel = Math.max(1, level || 1);
  if (safeLevel >= 5) return 3;
  if (safeLevel >= 3) return 2;
  return 1;
}

export function describeDailySessionLimit(limit: number | null, kind: 'microlearn' | 'meditation'): string {
  const label = kind === 'microlearn' ? 'microlearn' : 'meditation';
  const plural = kind === 'microlearn' ? 'microlearns' : 'meditations';
  if (limit === null) {
    return `Unlimited ${plural} with Pro.`;
  }
  if (limit <= 1) {
    return `1 ${label} per day · Level 3 unlocks 2 · Level 5 unlocks 3 · Pro is unlimited`;
  }
  return `${limit} ${plural} per day · Level 5 unlocks 3 · Pro is unlimited`;
}

export async function fetchDailyAccessProfile(
  userId: string
): Promise<DailyAccessProfile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('is_pro, level')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching access profile:', error);
    return { isPro: false, level: 1 };
  }

  return {
    isPro: !!data?.is_pro,
    level: typeof data?.level === 'number' ? data.level : 1,
  };
}
