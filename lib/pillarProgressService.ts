import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';
import { pushNotificationService } from './pushNotificationService';

export type PillarType = 'strength_fitness' | 'growth_wisdom' | 'discipline' | 'team_spirit' | 'overall';

export interface PillarProgress {
  id: string;
  user_id: string;
  pillar_type: PillarType;
  progress_percentage: number;
  last_activity_date: string | null;
  last_decay_date: string | null;
  actions_today: number;
  created_at: string;
  updated_at: string;
}

export interface PillarProgressMap {
  strength_fitness: number;
  growth_wisdom: number;
  discipline: number;
  team_spirit: number;
  overall: number;
}

const DECAY_WARNING_NOTIF_KEY = (userId: string) => `pillar_decay_warning_notif_${userId}`;
const DECAY_WARNED_TODAY_KEY = (userId: string, date: string) =>
  `pillar_decay_warned_${userId}_${date}`;

function parseDateOnly(isoDate: string): Date {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateOnly(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(dateStr: string, days: number): string {
  const d = parseDateOnly(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateOnly(d);
}

function daysBetween(startStr: string, endStr: string): number {
  const start = parseDateOnly(startStr);
  const end = parseDateOnly(endStr);
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

class PillarProgressService {
  private readonly PROGRESS_INCREMENT = 0.36;
  private readonly MAX_ACTIONS_PER_DAY = 2;
  private readonly DECAY_GRACE_DAYS = 3;
  /** 1/3 of max daily gain (2 × 0.36) */
  private readonly DECAY_AMOUNT = 0.24;

  private lastDecayCheck: { [userId: string]: number } = {};
  private readonly DECAY_CHECK_INTERVAL = 60000;

  /**
   * Initialize pillar progress records for a new user
   */
  async initializeUserPillars(userId: string): Promise<boolean> {
    try {
      const { data: existingPillars } = await supabase
        .from('pillar_progress')
        .select('pillar_type')
        .eq('user_id', userId);

      const existingTypes = new Set(existingPillars?.map(p => p.pillar_type) || []);

      const pillars: PillarType[] = ['strength_fitness', 'growth_wisdom', 'discipline', 'team_spirit', 'overall'];
      const missingPillars = pillars.filter(p => !existingTypes.has(p));

      if (missingPillars.length === 0) {
        return true;
      }

      const today = formatDateOnly(new Date());
      const records = missingPillars.map(pillar => ({
        user_id: userId,
        pillar_type: pillar,
        progress_percentage: 35.0,
        last_activity_date: today,
        actions_today: 0,
        last_decay_date: null,
      }));

      const { error } = await supabase
        .from('pillar_progress')
        .insert(records);

      if (error) {
        if (error.code === '42501') {
          return true;
        }
        console.error('Error initializing user pillars:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in initializeUserPillars:', error);
      return false;
    }
  }

  /**
   * Track an action and update pillar progress
   */
  async trackAction(userId: string, pillarType: PillarType, actionType: string): Promise<boolean> {
    try {
      if (pillarType === 'overall') {
        return true;
      }

      await this.initializeUserPillars(userId);

      const { data: pillar, error: fetchError } = await supabase
        .from('pillar_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('pillar_type', pillarType)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          const initialized = await this.initializeUserPillars(userId);
          if (!initialized) {
            console.error('Failed to initialize pillars after fetch error');
            return false;
          }
          const { data: retryPillar, error: retryError } = await supabase
            .from('pillar_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('pillar_type', pillarType)
            .single();

          if (retryError) {
            console.error('Error fetching pillar progress after init:', retryError);
            return false;
          }

          return this.processPillarUpdate(userId, pillarType, retryPillar);
        }
        console.error('Error fetching pillar progress:', {
          error: fetchError.message,
          code: fetchError.code,
          details: fetchError.details,
          hint: fetchError.hint,
          userId,
          pillarType
        });
        return false;
      }

      return this.processPillarUpdate(userId, pillarType, pillar);
    } catch (error: any) {
      console.error('Error in trackAction:', {
        error: error?.message || error,
        name: error?.name,
        stack: error?.stack,
        userId,
        pillarType,
        actionType
      });
      return false;
    }
  }

  /**
   * Process the actual pillar update (extracted for reuse)
   */
  private async processPillarUpdate(userId: string, pillarType: PillarType, pillar: any): Promise<boolean> {
    try {
      const today = formatDateOnly(new Date());
      let actionsToday = pillar.actions_today || 0;

      if (pillar.last_activity_date !== today) {
        actionsToday = 0;
      }

      if (actionsToday >= this.MAX_ACTIONS_PER_DAY) {
        return false;
      }

      const currentProgress = pillar.progress_percentage || 35;
      const newProgress = Math.min(100, currentProgress + this.PROGRESS_INCREMENT);
      const newActionsToday = actionsToday + 1;

      console.log(`📈 ${pillarType}: ${currentProgress.toFixed(2)}% → ${newProgress.toFixed(2)}% (+${this.PROGRESS_INCREMENT})`);

      const { error: updateError } = await supabase
        .from('pillar_progress')
        .update({
          progress_percentage: newProgress,
          last_activity_date: today,
          actions_today: newActionsToday,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('pillar_type', pillarType);

      if (updateError) {
        console.error('❌ Error updating pillar progress:', {
          error: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint,
          userId,
          pillarType
        });
        return false;
      }

      console.log(`✅ ${pillarType} progress updated successfully`);

      await this.updateOverallPillar(userId);

      // Reset the “progress dropping soon” reminder to grace end from today
      this.scheduleDecayWarning(userId, today).catch(() => {});

      return true;
    } catch (error: any) {
      console.error('❌ Error in processPillarUpdate:', error);
      return false;
    }
  }

  /**
   * Check and apply decay if needed for a specific pillar
   */
  async checkAndApplyDecay(userId: string, pillarType: PillarType): Promise<boolean> {
    try {
      if (pillarType === 'overall') return false;

      const { data: pillar, error } = await supabase
        .from('pillar_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('pillar_type', pillarType)
        .single();

      if (error || !pillar?.last_activity_date) return false;

      const today = formatDateOnly(new Date());
      const daysSinceActivity = daysBetween(pillar.last_activity_date, today);

      if (daysSinceActivity <= this.DECAY_GRACE_DAYS) {
        return false;
      }

      // First decay calendar day is activity + grace + 1
      const firstDecayDay = addDays(pillar.last_activity_date, this.DECAY_GRACE_DAYS + 1);
      let windowStart = firstDecayDay;

      if (pillar.last_decay_date) {
        const nextAfterLast = addDays(pillar.last_decay_date, 1);
        if (nextAfterLast > windowStart) {
          windowStart = nextAfterLast;
        }
      }

      if (windowStart > today) {
        return false;
      }

      const daysToApply = daysBetween(windowStart, today) + 1;
      if (daysToApply <= 0) return false;

      const decayAmount = daysToApply * this.DECAY_AMOUNT;
      const newProgress = Math.max(0, (pillar.progress_percentage || 0) - decayAmount);

      const { error: updateError } = await supabase
        .from('pillar_progress')
        .update({
          progress_percentage: newProgress,
          last_decay_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('pillar_type', pillarType);

      if (updateError) {
        console.error('Error applying pillar decay:', updateError);
        return false;
      }

      console.log(
        `📉 ${pillarType}: decayed ${decayAmount.toFixed(2)}% over ${daysToApply} day(s) → ${newProgress.toFixed(2)}%`
      );
      return true;
    } catch (error) {
      console.error('Error in checkAndApplyDecay:', error);
      return false;
    }
  }

  /**
   * Apply decay to all pillars for a user (throttled)
   */
  async applyDecay(userId: string): Promise<void> {
    try {
      const now = Date.now();
      const lastCheck = this.lastDecayCheck?.[userId] ?? 0;
      if (now - lastCheck < this.DECAY_CHECK_INTERVAL) {
        return;
      }

      if (!this.lastDecayCheck) {
        this.lastDecayCheck = {};
      }
      this.lastDecayCheck[userId] = now;

      const pillars: PillarType[] = ['strength_fitness', 'growth_wisdom', 'discipline', 'team_spirit'];
      const results = await Promise.all(
        pillars.map(pillar => this.checkAndApplyDecay(userId, pillar))
      );

      if (results.some(Boolean)) {
        await this.updateOverallPillar(userId);
      }

      // If already on last grace day for any pillar, nudge once today
      await this.warnIfOnLastGraceDay(userId);
    } catch (error) {
      console.error('Error in applyDecay:', error);
    }
  }

  /**
   * Schedule a local warning for noon on last_activity + grace days.
   */
  async scheduleDecayWarning(userId: string, lastActivityDate: string): Promise<void> {
    try {
      await this.cancelDecayWarning(userId);

      const warnDateStr = addDays(lastActivityDate, this.DECAY_GRACE_DAYS);
      const triggerDate = parseDateOnly(warnDateStr);
      triggerDate.setHours(12, 0, 0, 0);

      if (triggerDate.getTime() <= Date.now()) {
        // Already at/past warn time — fire soon once (deduped by day key)
        const today = formatDateOnly(new Date());
        const warnedKey = DECAY_WARNED_TODAY_KEY(userId, today);
        const already = await AsyncStorage.getItem(warnedKey);
        if (already) return;
        triggerDate.setTime(Date.now() + 15_000);
        await AsyncStorage.setItem(warnedKey, '1');
      }

      const notificationId = await pushNotificationService.scheduleLocalNotification(
        'Progress dropping soon',
        'Check in today — after 3 inactive days your pillars start losing 0.24% per day.',
        { type: 'pillar_decay_warning' },
        {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        }
      );

      await AsyncStorage.setItem(DECAY_WARNING_NOTIF_KEY(userId), notificationId);
    } catch (error) {
      console.warn('Failed to schedule pillar decay warning:', error);
    }
  }

  async cancelDecayWarning(userId: string): Promise<void> {
    try {
      const key = DECAY_WARNING_NOTIF_KEY(userId);
      const existingId = await AsyncStorage.getItem(key);
      if (existingId) {
        await pushNotificationService.cancelScheduledNotification(existingId);
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('Failed to cancel pillar decay warning:', error);
    }
  }

  /**
   * If any pillar is exactly on the last grace day, schedule a same-day warning once.
   */
  async warnIfOnLastGraceDay(userId: string): Promise<void> {
    try {
      const today = formatDateOnly(new Date());
      const warnedKey = DECAY_WARNED_TODAY_KEY(userId, today);
      if (await AsyncStorage.getItem(warnedKey)) return;

      const { data, error } = await supabase
        .from('pillar_progress')
        .select('pillar_type, last_activity_date')
        .eq('user_id', userId)
        .in('pillar_type', ['strength_fitness', 'growth_wisdom', 'discipline', 'team_spirit']);

      if (error || !data?.length) return;

      const onLastGraceDay = data.some((p) => {
        if (!p.last_activity_date) return false;
        return daysBetween(p.last_activity_date, today) === this.DECAY_GRACE_DAYS;
      });

      if (!onLastGraceDay) return;

      await AsyncStorage.setItem(warnedKey, '1');
      const triggerDate = new Date(Date.now() + 5_000);
      const notificationId = await pushNotificationService.scheduleLocalNotification(
        'Progress dropping soon',
        'Check in today — after 3 inactive days your pillars start losing 0.24% per day.',
        { type: 'pillar_decay_warning' },
        {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        }
      );
      await AsyncStorage.setItem(DECAY_WARNING_NOTIF_KEY(userId), notificationId);
    } catch (error) {
      console.warn('Failed to warn on last grace day:', error);
    }
  }

  /**
   * Update the overall pillar as average of other 4 pillars
   */
  async updateOverallPillar(userId: string): Promise<void> {
    try {
      const pillars: PillarType[] = ['strength_fitness', 'growth_wisdom', 'discipline', 'team_spirit'];

      const { data, error } = await supabase
        .from('pillar_progress')
        .select('progress_percentage')
        .eq('user_id', userId)
        .in('pillar_type', pillars);

      if (error || !data || data.length === 0) {
        console.error('Error fetching pillars for overall calculation:', error);
        return;
      }

      const average = data.reduce((sum, p) => sum + p.progress_percentage, 0) / data.length;

      await supabase
        .from('pillar_progress')
        .update({
          progress_percentage: average,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('pillar_type', 'overall');
    } catch (error) {
      console.error('Error in updateOverallPillar:', error);
    }
  }

  /**
   * Deduct progress when a habit is removed/undone
   */
  async deductAction(userId: string, pillarType: PillarType, actionType: string): Promise<boolean> {
    try {
      if (pillarType === 'overall') {
        return true;
      }

      const { data: pillar, error: fetchError } = await supabase
        .from('pillar_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('pillar_type', pillarType)
        .single();

      if (fetchError || !pillar) {
        console.error('Error fetching pillar for deduction:', fetchError);
        return false;
      }

      const today = formatDateOnly(new Date());

      if (pillar.last_activity_date !== today || pillar.actions_today <= 0) {
        return false;
      }

      const newProgress = Math.max(0, pillar.progress_percentage - this.PROGRESS_INCREMENT);
      const newActionsToday = Math.max(0, pillar.actions_today - 1);

      const { error: updateError } = await supabase
        .from('pillar_progress')
        .update({
          progress_percentage: newProgress,
          actions_today: newActionsToday,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('pillar_type', pillarType);

      if (updateError) {
        console.error('❌ Error deducting pillar progress:', updateError);
        return false;
      }

      await this.updateOverallPillar(userId);

      return true;
    } catch (error: any) {
      console.error('❌ Error in deductAction:', error);
      return false;
    }
  }

  /**
   * Get all pillar progress for a user
   */
  async getPillarProgress(userId: string): Promise<PillarProgressMap> {
    try {
      await this.initializeUserPillars(userId);

      const { data, error } = await supabase
        .from('pillar_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching pillar progress:', error);
        return {
          strength_fitness: 35,
          growth_wisdom: 35,
          discipline: 35,
          team_spirit: 35,
          overall: 35
        };
      }

      const progressMap: PillarProgressMap = {
        strength_fitness: 35,
        growth_wisdom: 35,
        discipline: 35,
        team_spirit: 35,
        overall: 35
      };

      data?.forEach((pillar: PillarProgress) => {
        progressMap[pillar.pillar_type] = pillar.progress_percentage;
      });

      return progressMap;
    } catch (error) {
      console.error('Error in getPillarProgress:', error);
      return {
        strength_fitness: 35,
        growth_wisdom: 35,
        discipline: 35,
        team_spirit: 35,
        overall: 35
      };
    }
  }
}

export const pillarProgressService = new PillarProgressService();
