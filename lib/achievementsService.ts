import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { pointsService } from './pointsService';
import { pillarProgressService } from './pillarProgressService';
import { streakService } from './streakService';
import {
  ACHIEVEMENT_DEFINITIONS,
  AchievementCriteria,
  BadgeDefinition,
  TOTAL_ACHIEVEMENTS,
} from './achievementDefinitions';

export interface UserAchievementUnlock {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
}

export interface BadgeWithStatus extends BadgeDefinition {
  unlocked: boolean;
  unlockedAt: string | null;
}

const FLAG_PREFIX = 'achievement_flag_';

class AchievementsService {
  getCatalog(): BadgeDefinition[] {
    return ACHIEVEMENT_DEFINITIONS;
  }

  async getUnlocked(userId: string): Promise<UserAchievementUnlock[]> {
    const { data, error } = await supabase
      .from('user_achievement_unlocks')
      .select('user_id, achievement_id, unlocked_at')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) {
      console.warn('getUnlocked achievements:', error.message);
      return [];
    }
    return (data || []) as UserAchievementUnlock[];
  }

  async getBadgesWithStatus(userId: string): Promise<BadgeWithStatus[]> {
    const unlocks = await this.getUnlocked(userId);
    const byId = new Map(unlocks.map((u) => [u.achievement_id, u.unlocked_at]));
    return ACHIEVEMENT_DEFINITIONS.map((def) => ({
      ...def,
      unlocked: byId.has(def.id),
      unlockedAt: byId.get(def.id) ?? null,
    }));
  }

  async setFlag(userId: string, key: string): Promise<void> {
    await AsyncStorage.setItem(`${FLAG_PREFIX}${userId}_${key}`, '1');
    // Re-evaluate so flag-based badges unlock promptly
    this.scheduleEvaluate(userId);
  }

  private evaluateTimer: ReturnType<typeof setTimeout> | null = null;

  /** Debounced unlock check — safe to call after every habit/action save. */
  scheduleEvaluate(userId: string): void {
    if (this.evaluateTimer) clearTimeout(this.evaluateTimer);
    this.evaluateTimer = setTimeout(() => {
      this.evaluateAndUnlock(userId).catch(() => {});
    }, 600);
  }

  async getFlag(userId: string, key: string): Promise<boolean> {
    const v = await AsyncStorage.getItem(`${FLAG_PREFIX}${userId}_${key}`);
    return v === '1';
  }

  private async unlockMany(userId: string, ids: string[]): Promise<string[]> {
    if (!ids.length) return [];
    const rows = ids.map((achievement_id) => ({
      user_id: userId,
      achievement_id,
      unlocked_at: new Date().toISOString(),
    }));
    const { data, error } = await supabase
      .from('user_achievement_unlocks')
      .upsert(rows, { onConflict: 'user_id,achievement_id', ignoreDuplicates: true })
      .select('achievement_id');

    if (error) {
      console.warn('unlockMany:', error.message);
      return [];
    }
    return (data || []).map((r: { achievement_id: string }) => r.achievement_id);
  }

  private habitCompleted(row: Record<string, any>, habit: string): boolean {
    switch (habit) {
      case 'gym':
        return !!(row.gym_day_type === 'active' || (row.gym_training_types && row.gym_training_types.length));
      case 'run':
        return !!(row.run_day_type === 'active' || row.run_distance || row.run_duration);
      case 'sleep':
        return !!(row.sleep_hours != null || row.sleep_quality != null || row.sleep_bedtime_hours != null);
      case 'water':
        return !!(row.water_intake != null && Number(row.water_intake) > 0);
      case 'reflect':
        return !!(row.reflect_mood != null || row.reflect_what_went_well || row.reflect_nothing_to_change);
      case 'focus':
        return !!(row.focus_completed || (row.focus_duration != null && Number(row.focus_duration) > 0));
      case 'cold_shower':
        return !!row.cold_shower_completed;
      case 'screen_time':
        return row.screen_time_minutes != null || !!row.screen_time_completed;
      default:
        return false;
    }
  }

  private pointsHabitCompleted(row: Record<string, any>, habit: string): boolean {
    const map: Record<string, string> = {
      gym: 'gym_completed',
      meditation: 'meditation_completed',
      microlearn: 'microlearn_completed',
      sleep: 'sleep_completed',
      water: 'water_completed',
      run: 'run_completed',
      reflect: 'reflect_completed',
      cold_shower: 'cold_shower_completed',
      update_goal: 'updated_goal_today',
      screen_time: 'screen_time_completed',
      focus: 'focus_completed',
    };
    const key = map[habit];
    return key ? !!row[key] : false;
  }

  private meets(criteria: AchievementCriteria, stats: EvalStats): boolean {
    switch (criteria.type) {
      case 'habit_completions':
        return (stats.habitCounts[criteria.habit] || 0) >= criteria.count;
      case 'custom_habit_completions':
        return stats.customHabitCompletions >= criteria.count;
      case 'streak_days':
        return stats.bestStreak >= criteria.count;
      case 'weekend_warrior':
        return stats.weekendWarrior;
      case 'perfect_day':
        return stats.maxHabitsInDay >= criteria.minHabits;
      case 'perfect_week':
        return stats.perfectWeek;
      case 'comeback_kid':
        return stats.comebackKid;
      case 'posts_count':
        return stats.postsCount >= criteria.count;
      case 'photos_count':
        return stats.photosCount >= criteria.count;
      case 'captioned_posts':
        return stats.captionedPosts >= criteria.count;
      case 'habit_showcase_post':
        return stats.habitShowcase;
      case 'post_distinct_dates':
        return stats.postDistinctDates >= criteria.count;
      case 'public_post':
        return stats.hasPublicPost;
      case 'early_bird_post':
        return stats.hasEarlyBirdPost;
      case 'following_count':
        return stats.followingCount >= criteria.count;
      case 'followers_count':
        return stats.followersCount >= criteria.count;
      case 'habit_invites_sent':
        return stats.invitesSent >= criteria.count;
      case 'partnerships_accepted':
        return stats.partnershipsAccepted >= criteria.count;
      case 'nudges_sent':
        return stats.nudgesSent >= criteria.count;
      case 'likes_given':
        return stats.likesGiven >= criteria.count;
      case 'comments_made':
        return stats.commentsMade >= criteria.count;
      case 'challenges_joined':
        return stats.challengesJoined >= criteria.count;
      case 'challenges_completed':
        return stats.challengesCompleted >= criteria.count;
      case 'challenges_won':
        return stats.challengesWon >= criteria.count;
      case 'challenge_proofs':
        return stats.challengeProofs >= criteria.count;
      case 'challenge_daily':
        return stats.challengeDaily;
      case 'challenge_weekly':
        return stats.challengeWeekly;
      case 'challenge_paid':
        return stats.challengePaid;
      case 'challenge_team':
        return stats.challengeTeam;
      case 'challenge_rejoin':
        return stats.challengeRejoin;
      case 'challenge_clean_sheet':
        return stats.challengeCleanSheet;
      case 'level':
        return stats.level >= criteria.min;
      case 'total_exp':
        return stats.totalExp >= criteria.min;
      case 'pillar_any':
        return stats.maxPillar >= criteria.minPercent;
      case 'pillar_all':
        return stats.minPillar >= criteria.minPercent;
      case 'profile_exists':
        return stats.profileExists;
      case 'active_days':
        return stats.activeDays >= criteria.count;
      case 'custom_habits_created':
        return stats.customHabitsCreated >= criteria.count;
      case 'flag':
        return !!stats.flags[criteria.key];
      case 'is_pro':
        return stats.isPro;
      default:
        return false;
    }
  }

  async evaluateAndUnlock(userId: string): Promise<string[]> {
    try {
      const existing = await this.getUnlocked(userId);
      const unlockedSet = new Set(existing.map((u) => u.achievement_id));
      const stats = await this.collectStats(userId);
      const candidates: string[] = [];

      for (const def of ACHIEVEMENT_DEFINITIONS) {
        if (unlockedSet.has(def.id)) continue;
        if (this.meets(def.criteria, stats)) candidates.push(def.id);
      }

      if (!candidates.length) return [];
      const newly = await this.unlockMany(userId, candidates);
      if (newly.length) {
        this.notifyUnlocks(userId, newly).catch(() => {});
      }
      return newly;
    } catch (e) {
      console.warn('evaluateAndUnlock failed:', e);
      return [];
    }
  }

  private async notifyUnlocks(userId: string, achievementIds: string[]): Promise<void> {
    const { notificationService } = await import('./notificationService');
    const { useNotificationsStore } = await import('../state/notificationsStore');

    for (let i = 0; i < achievementIds.length; i++) {
      const id = achievementIds[i];
      const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === id);
      if (!def) continue;

      await notificationService.createNotification(
        {
          user_id: userId,
          notification_type: 'achievement_unlocked',
          habit_type: id,
        },
        {
          title: '🏆 Achievement unlocked',
          body: def.title,
          extras: { achievementId: id, habitType: id },
        }
      );

      const delay = i * 4000;
      const bannerId = `achievement-${id}-${Date.now()}-${i}`;
      setTimeout(() => {
        useNotificationsStore.getState().showBanner({
          id: bannerId,
          type: 'achievement_unlocked',
          title: 'Achievement unlocked',
          body: def.title,
          habitType: id,
        });
      }, delay);
    }
  }

  private async collectStats(userId: string): Promise<EvalStats> {
    const [
      dailyHabitsRes,
      pointsRes,
      customHabitsRes,
      customCompletionsRes,
      postsRes,
      followingCount,
      followersCount,
      partnersRes,
      nudgesRes,
      likesRes,
      commentsRes,
      participantsRes,
      proofsRes,
      totalExp,
      pillars,
      profileRes,
      flags,
      streaks,
    ] = await Promise.all([
      supabase.from('daily_habits').select('*').eq('user_id', userId),
      supabase.from('user_points_daily').select('*').eq('user_id', userId),
      supabase.from('custom_habits').select('id').eq('user_id', userId),
      supabase.from('custom_habit_completions').select('id, habit_id, completed_at, date').eq('user_id', userId),
      supabase.from('daily_posts').select('id, created_at, date, captions, photos, is_public, habits_completed').eq('user_id', userId),
      socialCount(userId, 'following'),
      socialCount(userId, 'followers'),
      supabase.from('habit_accountability_partners').select('id, status, inviter_id, invitee_id').or(`inviter_id.eq.${userId},invitee_id.eq.${userId}`),
      supabase.from('habit_nudges').select('id').eq('nudger_id', userId).limit(100),
      supabase.from('daily_post_likes').select('id').eq('user_id', userId),
      supabase.from('daily_post_comments').select('id').eq('user_id', userId),
      supabase.from('challenge_participants').select('*, challenges(*)').eq('user_id', userId),
      supabase.from('challenge_submissions').select('id').eq('user_id', userId),
      pointsService.getTotalPoints(userId),
      pillarProgressService.getPillarProgress(userId),
      supabase.from('profiles').select('id, is_pro').eq('id', userId).maybeSingle(),
      this.loadFlags(userId),
      streakService.getActiveStreaks(userId).catch(() => []),
    ]);

    const habitCounts: Record<string, number> = {};
    const habitsList = [
      'gym', 'run', 'sleep', 'water', 'reflect', 'focus', 'cold_shower', 'screen_time',
      'meditation', 'microlearn', 'update_goal',
    ];
    for (const h of habitsList) habitCounts[h] = 0;

    const dailyRows = (dailyHabitsRes.data || []) as Record<string, any>[];
    const pointsRows = (pointsRes.data || []) as Record<string, any>[];

    for (const row of dailyRows) {
      for (const h of ['gym', 'run', 'sleep', 'water', 'reflect', 'focus', 'cold_shower', 'screen_time']) {
        if (this.habitCompleted(row, h)) habitCounts[h] += 1;
      }
    }
    for (const row of pointsRows) {
      for (const h of ['meditation', 'microlearn', 'update_goal', 'gym', 'run', 'sleep', 'water', 'reflect', 'cold_shower', 'screen_time', 'focus']) {
        if (this.pointsHabitCompleted(row, h)) {
          // Prefer max of daily_habits vs points to avoid double-count for overlapping habits
          // For meditation/microlearn/update_goal points is primary
          if (['meditation', 'microlearn', 'update_goal'].includes(h)) {
            habitCounts[h] += 1;
          }
        }
      }
    }

    // For habits tracked in both, use the larger signal without double counting:
    // recompute overlapping from the richer source only when points has the flag columns
    for (const h of ['gym', 'run', 'sleep', 'water', 'reflect', 'cold_shower', 'focus', 'screen_time']) {
      const fromPoints = pointsRows.filter((r) => this.pointsHabitCompleted(r, h)).length;
      habitCounts[h] = Math.max(habitCounts[h], fromPoints);
    }

    let maxHabitsInDay = 0;
    const dayHabitSets = new Map<string, Set<string>>();
    for (const row of pointsRows) {
      const date = row.date;
      if (!date) continue;
      const set = dayHabitSets.get(date) || new Set();
      for (const h of habitsList) {
        if (this.pointsHabitCompleted(row, h)) set.add(h);
      }
      dayHabitSets.set(date, set);
      maxHabitsInDay = Math.max(maxHabitsInDay, set.size);
    }
    for (const row of dailyRows) {
      const date = row.date;
      if (!date) continue;
      const set = dayHabitSets.get(date) || new Set();
      for (const h of ['gym', 'run', 'sleep', 'water', 'reflect', 'focus', 'cold_shower', 'screen_time']) {
        if (this.habitCompleted(row, h)) set.add(h);
      }
      dayHabitSets.set(date, set);
      maxHabitsInDay = Math.max(maxHabitsInDay, set.size);
    }

    // Weekend warrior: any ISO week with both Sat+Sun having habits
    let weekendWarrior = false;
    const byWeek = new Map<string, Set<number>>();
    for (const [date, set] of dayHabitSets) {
      if (set.size === 0) continue;
      const d = new Date(date + 'T12:00:00');
      const day = d.getDay(); // 0 Sun .. 6 Sat
      if (day !== 0 && day !== 6) continue;
      const weekKey = `${d.getFullYear()}-W${getWeekNumber(d)}`;
      const s = byWeek.get(weekKey) || new Set();
      s.add(day);
      byWeek.set(weekKey, s);
      if (s.has(0) && s.has(6)) weekendWarrior = true;
    }

    // Perfect week: 7 consecutive days with >= 1 habit
    const activeDates = Array.from(dayHabitSets.entries())
      .filter(([, s]) => s.size > 0)
      .map(([d]) => d)
      .sort();
    let perfectWeek = false;
    const activeSet = new Set(activeDates);
    for (const start of activeDates) {
      let ok = true;
      const d0 = new Date(start + 'T12:00:00');
      for (let i = 0; i < 7; i++) {
        const d = new Date(d0);
        d.setDate(d0.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        if (!activeSet.has(key)) {
          ok = false;
          break;
        }
      }
      if (ok) {
        perfectWeek = true;
        break;
      }
    }

    // Comeback kid: any habit with gap >= 7 days then completion
    let comebackKid = false;
    const allDates = activeDates;
    for (let i = 1; i < allDates.length; i++) {
      const prev = new Date(allDates[i - 1] + 'T12:00:00');
      const cur = new Date(allDates[i] + 'T12:00:00');
      const gap = (cur.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (gap >= 7) {
        comebackKid = true;
        break;
      }
    }

    const posts = (postsRes.data || []) as any[];
    let photosCount = 0;
    let captionedPosts = 0;
    let habitShowcase = false;
    const postDates = new Set<string>();
    let hasPublicPost = false;
    let hasEarlyBirdPost = false;
    for (const p of posts) {
      const urls = p.photos || [];
      if (Array.isArray(urls)) photosCount += urls.length;
      const captions = p.captions || [];
      if (Array.isArray(captions) && captions.some((c: string) => !!c?.trim())) captionedPosts += 1;
      else if (typeof p.captions === 'string' && p.captions.trim()) captionedPosts += 1;
      const habits = p.habits_completed || [];
      if (Array.isArray(habits) && habits.filter(Boolean).length >= 3) habitShowcase = true;
      const dateKey = p.date || (p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : null);
      if (dateKey) postDates.add(dateKey);
      if (p.created_at) {
        const d = new Date(p.created_at);
        if (d.getHours() < 9) hasEarlyBirdPost = true;
      }
      if (p.is_public) hasPublicPost = true;
    }

    const partners = (partnersRes.data || []) as any[];
    const invitesSent = partners.filter((p) => p.inviter_id === userId).length;
    const partnershipsAccepted = partners.filter((p) => p.status === 'accepted').length;

    const participants = (participantsRes.data || []) as any[];
    let challengesCompleted = 0;
    let challengesWon = 0;
    let challengeDaily = false;
    let challengeWeekly = false;
    let challengePaid = false;
    let challengeTeam = false;
    let challengeCleanSheet = false;
    for (const p of participants) {
      const ch = p.challenges || p.challenge || {};
      if (p.status === 'completed' || p.completed_at) challengesCompleted += 1;
      if (p.is_winner || p.rank === 1 || p.status === 'won') challengesWon += 1;
      const freq = (ch.frequency || ch.recurrence || ch.type || '').toString().toLowerCase();
      if (freq.includes('daily')) challengeDaily = true;
      if (freq.includes('weekly')) challengeWeekly = true;
      if (Number(ch.entry_fee || ch.pot_amount || 0) > 0 || ch.is_paid) challengePaid = true;
      if (Number(ch.participant_count || ch.participants_count || 0) >= 5) challengeTeam = true;
      if (p.completion_percent === 100 || p.progress === 100) challengeCleanSheet = true;
    }

    const challengeRejoin = participants.some((p) => p.rejoined_at || (p.left_at && p.joined_at && p.left_at < p.joined_at));

    const pillarValues = [
      pillars?.strength_fitness ?? 0,
      pillars?.growth_wisdom ?? 0,
      pillars?.discipline ?? 0,
      pillars?.team_spirit ?? 0,
    ];
    const maxPillar = Math.max(...pillarValues);
    const minPillar = Math.min(...pillarValues);

    const streakList = Array.isArray(streaks) ? streaks : [];
    const bestStreak = streakList.reduce(
      (max, s: any) => Math.max(max, Number(s?.longest_streak || 0), Number(s?.current_streak || 0)),
      0
    );

    const level = pointsService.getCurrentLevel(totalExp || 0);

    return {
      habitCounts,
      customHabitCompletions: (customCompletionsRes.data || []).length,
      customHabitsCreated: (customHabitsRes.data || []).length,
      bestStreak,
      weekendWarrior,
      maxHabitsInDay,
      perfectWeek,
      comebackKid,
      postsCount: posts.length,
      photosCount,
      captionedPosts,
      habitShowcase,
      postDistinctDates: postDates.size,
      hasPublicPost,
      hasEarlyBirdPost,
      followingCount,
      followersCount,
      invitesSent,
      partnershipsAccepted,
      nudgesSent: (nudgesRes.data || []).length,
      likesGiven: (likesRes.data || []).length,
      commentsMade: (commentsRes.data || []).length,
      challengesJoined: participants.length,
      challengesCompleted,
      challengesWon,
      challengeProofs: (proofsRes.data || []).length,
      challengeDaily,
      challengeWeekly,
      challengePaid,
      challengeTeam,
      challengeRejoin,
      challengeCleanSheet,
      level,
      totalExp: totalExp || 0,
      maxPillar,
      minPillar,
      profileExists: !!profileRes.data,
      activeDays: activeDates.length,
      flags,
      isPro: !!profileRes.data?.is_pro,
    };
  }

  private async loadFlags(userId: string): Promise<Record<string, boolean>> {
    const keys = ['insights_opened', 'pro_modal_opened'];
    const out: Record<string, boolean> = {};
    await Promise.all(
      keys.map(async (k) => {
        out[k] = await this.getFlag(userId, k);
      })
    );
    return out;
  }
}

interface EvalStats {
  habitCounts: Record<string, number>;
  customHabitCompletions: number;
  customHabitsCreated: number;
  bestStreak: number;
  weekendWarrior: boolean;
  maxHabitsInDay: number;
  perfectWeek: boolean;
  comebackKid: boolean;
  postsCount: number;
  photosCount: number;
  captionedPosts: number;
  habitShowcase: boolean;
  postDistinctDates: number;
  hasPublicPost: boolean;
  hasEarlyBirdPost: boolean;
  followingCount: number;
  followersCount: number;
  invitesSent: number;
  partnershipsAccepted: number;
  nudgesSent: number;
  likesGiven: number;
  commentsMade: number;
  challengesJoined: number;
  challengesCompleted: number;
  challengesWon: number;
  challengeProofs: number;
  challengeDaily: boolean;
  challengeWeekly: boolean;
  challengePaid: boolean;
  challengeTeam: boolean;
  challengeRejoin: boolean;
  challengeCleanSheet: boolean;
  level: number;
  totalExp: number;
  maxPillar: number;
  minPillar: number;
  profileExists: boolean;
  activeDays: number;
  flags: Record<string, boolean>;
  isPro: boolean;
}

async function socialCount(userId: string, kind: 'followers' | 'following'): Promise<number> {
  if (kind === 'followers') {
    const { count } = await supabase
      .from('followers')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);
    return count || 0;
  }
  const { count } = await supabase
    .from('followers')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId);
  return count || 0;
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export const achievementsService = new AchievementsService();
export { TOTAL_ACHIEVEMENTS };
