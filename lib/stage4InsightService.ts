import { supabase } from './supabase';
import { analyticsService } from './analyticsService';
import { patternService } from './patternService';
import { dailyHabitsService } from './dailyHabitsService';
import { habitInviteService } from './habitInviteService';
import TimePeriodUtils from './timePeriodUtils';

export interface AchievementMoment {
  id: string;
  title: string;
  message: string;
}

export interface WeekdayInsight {
  bestDay: string | null;
  worstDay: string | null;
  overallConsistency: number;
}

export interface ColdShowerInsight {
  completionPct: number;
  streak: number;
  completedDays: number;
  daysInPeriod: number;
}

export interface PartnerAccountabilityInsight {
  hasPartner: boolean;
  partnerName: string | null;
  habitLabel: string | null;
  sharedStreak: number;
  winRate: number | null;
  bothCompletedDays: number;
  daysCompared: number;
}

export interface Stage4Dashboard {
  achievements: AchievementMoment[];
  weekday: WeekdayInsight;
  coldShower: ColdShowerInsight;
  partner: PartnerAccountabilityInsight | null;
  correlations: {
    title: string;
    strength: string;
    coefficient: number;
    dataPoints: number;
    description: string;
  }[];
}

function capitalize(day: string | null): string | null {
  if (!day) return null;
  return day.charAt(0).toUpperCase() + day.slice(1);
}

class Stage4InsightService {
  async getDashboard(userId: string): Promise<Stage4Dashboard> {
    const [weekday, coldShower, partner, correlations, achievements] = await Promise.all([
      this.getWeekdayInsight(userId),
      this.getColdShowerInsight(userId),
      this.getPartnerInsight(userId),
      this.getCorrelationNumbers(userId),
      this.getAchievementMoments(userId),
    ]);

    return { achievements, weekday, coldShower, partner, correlations };
  }

  private async getWeekdayInsight(userId: string): Promise<WeekdayInsight> {
    try {
      const patterns = await patternService.getPatternAnalytics(userId);
      return {
        bestDay: capitalize(patterns.bestDay),
        worstDay: capitalize(patterns.worstDay),
        overallConsistency: Math.round(patterns.overallConsistency || 0),
      };
    } catch (error) {
      console.error('Error weekday insight:', error);
      return { bestDay: null, worstDay: null, overallConsistency: 0 };
    }
  }

  private async getColdShowerInsight(userId: string): Promise<ColdShowerInsight> {
    try {
      const rate = await analyticsService.calculateHabitCompletionRate(userId, 'currentWeek');
      const cold = rate.habitBreakdown.cold_shower;
      const range = analyticsService.getCalendarWeekRange(0);
      const daysInPeriod = TimePeriodUtils.getDaysBetween(range.startDate, range.endDate) || 1;
      const completedDays = Math.round(((cold?.completion || 0) / 100) * daysInPeriod);

      return {
        completionPct: Math.round(cold?.completion || 0),
        streak: cold?.streak || 0,
        completedDays,
        daysInPeriod,
      };
    } catch (error) {
      console.error('Error cold shower insight:', error);
      return { completionPct: 0, streak: 0, completedDays: 0, daysInPeriod: 0 };
    }
  }

  private async getCorrelationNumbers(userId: string) {
    try {
      const insights = await analyticsService.generateCorrelationInsights(userId, 30);
      return insights.map((c) => ({
        title: c.title,
        strength: c.strength,
        coefficient: c.coefficient,
        dataPoints: c.dataPoints,
        description: c.description,
      }));
    } catch (error) {
      console.error('Error correlation numbers:', error);
      return [];
    }
  }

  private async getPartnerInsight(userId: string): Promise<PartnerAccountabilityInsight | null> {
    try {
      const partners = await habitInviteService.getActivePartners(userId);
      if (!partners.length) return null;

      const partnership = partners[0];
      const partnerId =
        partnership.inviter_id === userId ? partnership.invitee_id : partnership.inviter_id;
      const partnerName =
        partnership.partner?.display_name ||
        partnership.partner?.username ||
        'Partner';

      const habitLabel = partnership.habit_key
        ? analyticsService.formatHabitLabel(partnership.habit_key)
        : partnership.habit_type === 'custom'
          ? 'Custom habit'
          : 'Shared habit';

      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - 29);
      const startDate = TimePeriodUtils.toLocalDateString(start);
      const endDate = TimePeriodUtils.toLocalDateString(end);

      const { data: rows, error } = await supabase
        .from('habit_partner_progress')
        .select('user_id, date, completed, streak_count')
        .eq('partnership_id', partnership.id)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      const byDate = new Map<string, { me?: boolean; partner?: boolean; myStreak?: number }>();
      for (const row of rows || []) {
        const entry = byDate.get(row.date) || {};
        if (row.user_id === userId) {
          entry.me = !!row.completed;
          entry.myStreak = row.streak_count || 0;
        } else if (row.user_id === partnerId) {
          entry.partner = !!row.completed;
        }
        byDate.set(row.date, entry);
      }

      let bothCompletedDays = 0;
      let eitherCompletedDays = 0;
      const dates = TimePeriodUtils.eachDate(startDate, endDate);

      for (const d of dates) {
        const e = byDate.get(d);
        if (!e) continue;
        if (e.me || e.partner) eitherCompletedDays++;
        if (e.me && e.partner) bothCompletedDays++;
      }

      // Shared streak: consecutive days ending at today where both completed
      let sharedStreak = 0;
      for (let i = dates.length - 1; i >= 0; i--) {
        const e = byDate.get(dates[i]);
        if (e?.me && e?.partner) sharedStreak++;
        else break;
      }

      const winRate =
        eitherCompletedDays > 0
          ? Math.round((bothCompletedDays / eitherCompletedDays) * 100)
          : null;

      return {
        hasPartner: true,
        partnerName,
        habitLabel,
        sharedStreak,
        winRate,
        bothCompletedDays,
        daysCompared: eitherCompletedDays,
      };
    } catch (error) {
      console.error('Error partner insight:', error);
      return null;
    }
  }

  private async getAchievementMoments(userId: string): Promise<AchievementMoment[]> {
    const moments: AchievementMoment[] = [];
    try {
      const habitTypes = ['sleep', 'water', 'run', 'gym', 'reflect', 'cold_shower'];
      const [streaks, correlations, sleepThis, sleepLast, patterns, login] = await Promise.all([
        dailyHabitsService.getHabitStreaksBatch(userId, habitTypes),
        analyticsService.generateCorrelationInsights(userId, 30),
        analyticsService.getSleepSnapshot(userId),
        this.getSleepForWeekOffset(userId, -1),
        patternService.getPatternAnalytics(userId),
        dailyHabitsService.getLoginStreak(userId),
      ]);

      const top = streaks
        .filter((s) => s.current_streak > 0)
        .sort((a, b) => b.current_streak - a.current_streak)[0];

      if (top && top.current_streak >= 7) {
        moments.push({
          id: 'streak-7',
          title: 'On fire',
          message: `${analyticsService.formatHabitLabel(top.habit_type)} streak hit ${top.current_streak} days.`,
        });
      } else if (top && top.current_streak >= 3) {
        moments.push({
          id: 'streak-building',
          title: 'Streak building',
          message: `${analyticsService.formatHabitLabel(top.habit_type)} is at ${top.current_streak} days — keep going.`,
        });
      }

      if (correlations.length > 0) {
        const strongest = correlations.reduce((a, b) =>
          Math.abs(b.coefficient) > Math.abs(a.coefficient) ? b : a
        );
        moments.push({
          id: 'correlation',
          title: 'Pattern unlocked',
          message: `${strongest.title}: r = ${strongest.coefficient > 0 ? '+' : ''}${strongest.coefficient} (${strongest.strength}).`,
        });
      }

      if (
        sleepThis.nightsLogged > 0 &&
        sleepLast.nightsLogged > 0 &&
        sleepThis.averageQuality != null &&
        sleepLast.averageQuality != null &&
        sleepThis.averageQuality > sleepLast.averageQuality
      ) {
        moments.push({
          id: 'best-sleep-week',
          title: 'Best sleep week',
          message: `Sleep quality avg ${sleepThis.averageQuality} beats last week’s ${sleepLast.averageQuality}.`,
        });
      } else if (
        sleepThis.nightsLogged >= 3 &&
        sleepThis.averageHours != null &&
        sleepThis.averageHours >= 7
      ) {
        moments.push({
          id: 'solid-sleep',
          title: 'Solid sleep',
          message: `Averaging ${sleepThis.averageHours}h this week across ${sleepThis.nightsLogged} nights.`,
        });
      }

      if (patterns.bestDay) {
        moments.push({
          id: 'best-weekday',
          title: 'Peak weekday',
          message: `Your strongest habit day is ${capitalize(patterns.bestDay)}s.`,
        });
      }

      if (login.current_streak >= 7) {
        moments.push({
          id: 'login-7',
          title: 'Showing up',
          message: `${login.current_streak}-day login streak — consistency compounds.`,
        });
      }

      return moments.slice(0, 4);
    } catch (error) {
      console.error('Error achievement moments:', error);
      return moments;
    }
  }

  private async getSleepForWeekOffset(userId: string, offsetWeeks: number) {
    try {
      const range = analyticsService.getCalendarWeekRange(offsetWeeks);
      const rows = await dailyHabitsService.getDailyHabitsRange(
        userId,
        range.startDate,
        range.endDate
      );
      const sleepRows = rows.filter(
        (r) =>
          (r.sleep_hours != null && Number(r.sleep_hours) > 0) ||
          r.sleep_quality != null ||
          r.sleep_bedtime_hours != null
      );
      const qualities = sleepRows
        .map((r) => (r.sleep_quality != null ? Number(r.sleep_quality) : null))
        .filter((q): q is number => q != null);
      return {
        nightsLogged: sleepRows.length,
        averageQuality:
          qualities.length > 0
            ? Math.round(qualities.reduce((a, b) => a + b, 0) / qualities.length)
            : null,
      };
    } catch {
      return { nightsLogged: 0, averageQuality: null };
    }
  }
}

export const stage4InsightService = new Stage4InsightService();
