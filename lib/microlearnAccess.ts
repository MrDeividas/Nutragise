import { supabase } from './supabase';
import {
  describeDailySessionLimit,
  fetchDailyAccessProfile,
  getAppDayStart,
  getDailySessionLimit,
} from './dailyAccessLimits';

export type MicrolearnStartResult =
  | { allowed: true; alreadyStarted: boolean }
  | { allowed: false; reason: 'daily_limit' | 'not_logged_in' | 'error'; message: string };

/**
 * Free / leveled users may start a limited number of NEW microlearns per app-day.
 * Pro users are unlimited.
 * Anything already started (or completed) can always be opened again.
 */
export async function ensureMicrolearnStart(
  userId: string | undefined | null,
  informationId: string
): Promise<MicrolearnStartResult> {
  if (!userId) {
    return { allowed: false, reason: 'not_logged_in', message: 'You must be logged in to start a microlearn.' };
  }

  try {
    const { data: existing, error: existingError } = await supabase
      .from('user_progress')
      .select('id, completed, started_at')
      .eq('user_id', userId)
      .eq('information_id', informationId)
      .maybeSingle();

    if (existingError && existingError.code !== 'PGRST116') {
      throw existingError;
    }

    if (existing) {
      if (!existing.started_at) {
        await supabase
          .from('user_progress')
          .update({ started_at: new Date().toISOString() })
          .eq('id', existing.id);
      }
      return { allowed: true, alreadyStarted: true };
    }

    const profile = await fetchDailyAccessProfile(userId);
    const dailyLimit = getDailySessionLimit(profile.level, profile.isPro);

    if (dailyLimit !== null) {
      const dayStart = getAppDayStart().toISOString();
      const { count, error: countError } = await supabase
        .from('user_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('started_at', dayStart);

      if (countError) throw countError;

      if ((count || 0) >= dailyLimit) {
        return {
          allowed: false,
          reason: 'daily_limit',
          message:
            dailyLimit === 1
              ? 'You can start 1 new microlearn per day. Reach Level 3 for 2, Level 5 for 3, or upgrade to Pro for unlimited. Anything you already started stays unlocked.'
              : `You've reached today's limit of ${dailyLimit} new microlearns. Reach Level 5 for 3/day, or upgrade to Pro for unlimited. Anything you already started stays unlocked.`,
        };
      }
    }

    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from('user_progress').insert({
      user_id: userId,
      information_id: informationId,
      completed: false,
      passed: false,
      score_percentage: 0,
      correct_answers: 0,
      attempts_count: 0,
      started_at: now,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return { allowed: true, alreadyStarted: true };
      }
      throw insertError;
    }

    return { allowed: true, alreadyStarted: false };
  } catch (error) {
    console.error('ensureMicrolearnStart error:', error);
    return {
      allowed: false,
      reason: 'error',
      message: 'Could not start this microlearn. Please try again.',
    };
  }
}

export async function getStartedMicrolearnIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('user_progress')
    .select('information_id, started_at, completed')
    .eq('user_id', userId);

  if (error) {
    console.error('getStartedMicrolearnIds error:', error);
    return new Set();
  }

  const ids = new Set<string>();
  data?.forEach((row) => {
    if (row.started_at || row.completed) {
      ids.add(row.information_id);
    }
  });
  return ids;
}

export async function getMicrolearnLimitHint(userId: string | undefined | null): Promise<string> {
  if (!userId) return describeDailySessionLimit(1, 'microlearn');
  const profile = await fetchDailyAccessProfile(userId);
  return describeDailySessionLimit(getDailySessionLimit(profile.level, profile.isPro), 'microlearn');
}
