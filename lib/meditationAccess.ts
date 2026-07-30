import { supabase } from './supabase';
import {
  describeDailySessionLimit,
  fetchDailyAccessProfile,
  getAppDayStart,
  getDailySessionLimit,
} from './dailyAccessLimits';

export type MeditationStartResult =
  | { allowed: true; usedToday: number; limit: number | null }
  | { allowed: false; reason: 'daily_limit' | 'not_logged_in' | 'error'; message: string; usedToday?: number; limit?: number | null };

/**
 * Free / leveled users may complete a limited number of meditations per app-day.
 * Pro users are unlimited.
 */
export async function ensureMeditationStart(
  userId: string | undefined | null
): Promise<MeditationStartResult> {
  if (!userId) {
    return {
      allowed: false,
      reason: 'not_logged_in',
      message: 'You must be logged in to start a meditation.',
    };
  }

  try {
    const profile = await fetchDailyAccessProfile(userId);
    const dailyLimit = getDailySessionLimit(profile.level, profile.isPro);
    const dayStart = getAppDayStart().toISOString();

    const { count, error: countError } = await supabase
      .from('meditation_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('completed_at', dayStart);

    if (countError) throw countError;

    const usedToday = count || 0;

    if (dailyLimit !== null && usedToday >= dailyLimit) {
      return {
        allowed: false,
        reason: 'daily_limit',
        usedToday,
        limit: dailyLimit,
        message:
          dailyLimit === 1
            ? 'You can meditate once per day. Reach Level 3 for 2/day, Level 5 for 3/day, or upgrade to Pro for unlimited.'
            : `You've reached today's limit of ${dailyLimit} meditations. Reach Level 5 for 3/day, or upgrade to Pro for unlimited.`,
      };
    }

    return { allowed: true, usedToday, limit: dailyLimit };
  } catch (error) {
    console.error('ensureMeditationStart error:', error);
    return {
      allowed: false,
      reason: 'error',
      message: 'Could not start this meditation. Please try again.',
    };
  }
}

export async function getMeditationLimitHint(userId: string | undefined | null): Promise<string> {
  if (!userId) return describeDailySessionLimit(1, 'meditation');
  const profile = await fetchDailyAccessProfile(userId);
  return describeDailySessionLimit(getDailySessionLimit(profile.level, profile.isPro), 'meditation');
}
