import { supabase } from './supabase';
import { meditationService } from './meditationService';
import { dailyHabitsService } from './dailyHabitsService';
import { pillarProgressService } from './pillarProgressService';
import { progressService } from './progressService';
import { calculateTotalSessions } from './goalHelpers';
import TimePeriodUtils from './timePeriodUtils';
import { analyticsService } from './analyticsService';

export interface MeditationInsight {
  weekSessions: number;
  weekMinutes: number;
  avgSessionMinutes: number;
  allTimeSessions: number;
  allTimeMinutes: number;
}

export interface MicrolearnInsight {
  completed: number;
  passed: number;
  passRate: number | null;
  avgScore: number | null;
  started: number;
}

export interface GoalsInsight {
  activeGoals: number;
  checkInsThisWeek: number;
  avgCompletionPct: number | null;
  onTrackCount: number;
}

export interface PillarsInsight {
  overall: number;
  weakest: string | null;
  weakestPct: number | null;
  strength_fitness: number;
  growth_wisdom: number;
  discipline: number;
  team_spirit: number;
}

export interface LoginInsight {
  currentStreak: number;
  longestStreak: number;
}

export interface ChallengesInsight {
  activeCount: number;
  avgCompletionPct: number | null;
  totalDaysMissed: number;
}

export interface ScreenTimeInsight {
  dailyHours: number[]; // 7 days Mon.. or last 7 rolling — Insights uses last 7
  averageHours: number | null;
  hasData: boolean;
}

export interface Stage3Dashboard {
  meditation: MeditationInsight;
  microlearn: MicrolearnInsight;
  goals: GoalsInsight;
  pillars: PillarsInsight;
  login: LoginInsight;
  challenges: ChallengesInsight;
  screenTime: ScreenTimeInsight;
}

const PILLAR_LABELS: Record<string, string> = {
  strength_fitness: 'Strength',
  growth_wisdom: 'Growth',
  discipline: 'Discipline',
  team_spirit: 'Team',
};

class Stage3InsightService {
  async getDashboard(userId: string): Promise<Stage3Dashboard> {
    const [
      meditation,
      microlearn,
      goals,
      pillars,
      login,
      challenges,
      screenTime,
    ] = await Promise.all([
      this.getMeditationInsight(userId),
      this.getMicrolearnInsight(userId),
      this.getGoalsInsight(userId),
      this.getPillarsInsight(userId),
      this.getLoginInsight(userId),
      this.getChallengesInsight(userId),
      this.getScreenTimeInsight(userId),
    ]);

    return { meditation, microlearn, goals, pillars, login, challenges, screenTime };
  }

  private async getMeditationInsight(userId: string): Promise<MeditationInsight> {
    try {
      const range = analyticsService.getCalendarWeekRange(0);
      const startIso = `${range.startDate}T00:00:00`;
      const endIso = `${range.endDate}T23:59:59`;

      const [allTime, weekRes] = await Promise.all([
        meditationService.getStats(userId),
        supabase
          .from('meditation_sessions')
          .select('duration_minutes, completed_at')
          .eq('user_id', userId)
          .gte('completed_at', startIso)
          .lte('completed_at', endIso),
      ]);

      const weekRows = weekRes.data || [];
      const weekMinutes = weekRows.reduce((s, r) => s + (r.duration_minutes || 0), 0);
      const weekSessions = weekRows.length;

      return {
        weekSessions,
        weekMinutes,
        avgSessionMinutes:
          weekSessions > 0
            ? Math.round(weekMinutes / weekSessions)
            : allTime.averageSessionMinutes || 0,
        allTimeSessions: allTime.totalSessions,
        allTimeMinutes: allTime.totalTimeMinutes,
      };
    } catch (error) {
      console.error('Error meditation insight:', error);
      return {
        weekSessions: 0,
        weekMinutes: 0,
        avgSessionMinutes: 0,
        allTimeSessions: 0,
        allTimeMinutes: 0,
      };
    }
  }

  private async getMicrolearnInsight(userId: string): Promise<MicrolearnInsight> {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('completed, passed, score_percentage, started_at')
        .eq('user_id', userId);

      if (error) throw error;
      const rows = data || [];
      const started = rows.filter((r) => r.started_at || r.completed).length;
      const completed = rows.filter((r) => r.completed).length;
      const passed = rows.filter((r) => r.passed).length;
      const scores = rows
        .map((r) => r.score_percentage)
        .filter((s): s is number => s != null && !Number.isNaN(Number(s)))
        .map(Number);

      return {
        completed,
        passed,
        passRate: completed > 0 ? Math.round((passed / completed) * 100) : null,
        avgScore:
          scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : null,
        started,
      };
    } catch (error) {
      console.error('Error microlearn insight:', error);
      return { completed: 0, passed: 0, passRate: null, avgScore: null, started: 0 };
    }
  }

  private async getGoalsInsight(userId: string): Promise<GoalsInsight> {
    try {
      const range = analyticsService.getCalendarWeekRange(0);
      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false);

      if (error) throw error;
      const active = goals || [];
      if (active.length === 0) {
        return { activeGoals: 0, checkInsThisWeek: 0, avgCompletionPct: null, onTrackCount: 0 };
      }

      const goalIds = active.map((g) => g.id);
      const { data: weekCheckIns } = await supabase
        .from('progress_photos')
        .select('goal_id, check_in_date')
        .eq('user_id', userId)
        .in('goal_id', goalIds)
        .gte('check_in_date', range.startDate)
        .lte('check_in_date', range.endDate);

      const checkInsThisWeek = weekCheckIns?.length || 0;

      const completionPcts: number[] = [];
      let onTrackCount = 0;

      for (const goal of active) {
        const totalCheckIns = await progressService.getCheckInCount(goal.id, userId);
        const totalSessions = calculateTotalSessions(goal);
        const pct =
          totalSessions > 0 ? Math.min(100, Math.round((totalCheckIns / totalSessions) * 100)) : null;
        if (pct != null) {
          completionPcts.push(pct);
          if (goal.start_date && goal.end_date) {
            const start = TimePeriodUtils.parseLocalDate(goal.start_date);
            const end = TimePeriodUtils.parseLocalDate(goal.end_date);
            const today = new Date();
            const elapsed = Math.max(
              0,
              Math.min(
                1,
                (today.getTime() - start.getTime()) / Math.max(1, end.getTime() - start.getTime())
              )
            );
            if (pct >= elapsed * 100 * 0.75) onTrackCount++;
          } else if (pct >= 50) {
            onTrackCount++;
          }
        }
      }

      return {
        activeGoals: active.length,
        checkInsThisWeek,
        avgCompletionPct:
          completionPcts.length > 0
            ? Math.round(completionPcts.reduce((a, b) => a + b, 0) / completionPcts.length)
            : null,
        onTrackCount,
      };
    } catch (error) {
      console.error('Error goals insight:', error);
      return { activeGoals: 0, checkInsThisWeek: 0, avgCompletionPct: null, onTrackCount: 0 };
    }
  }

  private async getPillarsInsight(userId: string): Promise<PillarsInsight> {
    try {
      const map = await pillarProgressService.getPillarProgress(userId);
      const keys = ['strength_fitness', 'growth_wisdom', 'discipline', 'team_spirit'] as const;
      let weakest: string | null = null;
      let weakestPct: number | null = null;
      for (const key of keys) {
        const pct = map[key];
        if (weakestPct == null || pct < weakestPct) {
          weakestPct = pct;
          weakest = PILLAR_LABELS[key];
        }
      }
      return {
        overall: Math.round(map.overall),
        weakest,
        weakestPct: weakestPct != null ? Math.round(weakestPct) : null,
        strength_fitness: Math.round(map.strength_fitness),
        growth_wisdom: Math.round(map.growth_wisdom),
        discipline: Math.round(map.discipline),
        team_spirit: Math.round(map.team_spirit),
      };
    } catch (error) {
      console.error('Error pillars insight:', error);
      return {
        overall: 0,
        weakest: null,
        weakestPct: null,
        strength_fitness: 0,
        growth_wisdom: 0,
        discipline: 0,
        team_spirit: 0,
      };
    }
  }

  private async getLoginInsight(userId: string): Promise<LoginInsight> {
    try {
      const streak = await dailyHabitsService.getLoginStreak(userId);
      return {
        currentStreak: streak.current_streak || 0,
        longestStreak: streak.longest_streak || 0,
      };
    } catch (error) {
      console.error('Error login insight:', error);
      return { currentStreak: 0, longestStreak: 0 };
    }
  }

  private async getChallengesInsight(userId: string): Promise<ChallengesInsight> {
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('status, completion_percentage, days_missed')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;
      const rows = data || [];
      if (rows.length === 0) {
        return { activeCount: 0, avgCompletionPct: null, totalDaysMissed: 0 };
      }

      const pcts = rows
        .map((r) => Number(r.completion_percentage) || 0);
      const totalDaysMissed = rows.reduce((s, r) => s + (Number((r as any).days_missed) || 0), 0);

      return {
        activeCount: rows.length,
        avgCompletionPct: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
        totalDaysMissed,
      };
    } catch (error) {
      console.error('Error challenges insight:', error);
      return { activeCount: 0, avgCompletionPct: null, totalDaysMissed: 0 };
    }
  }

  private async getScreenTimeInsight(userId: string): Promise<ScreenTimeInsight> {
    try {
      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      const startDate = TimePeriodUtils.toLocalDateString(start);
      const endDate = TimePeriodUtils.toLocalDateString(end);

      const rows = await dailyHabitsService.getDailyHabitsRange(userId, startDate, endDate);
      const byDate = new Map(rows.map((r) => [r.date, r]));

      const dailyHours: number[] = [];
      let logged = 0;
      for (const dateStr of TimePeriodUtils.eachDate(startDate, endDate)) {
        const record = byDate.get(dateStr) as any;
        const minutes = record?.screen_time_minutes;
        if (minutes != null && Number(minutes) > 0) {
          dailyHours.push(Math.round((Number(minutes) / 60) * 10) / 10);
          logged++;
        } else {
          dailyHours.push(0);
        }
      }

      if (logged === 0) {
        return { dailyHours, averageHours: null, hasData: false };
      }

      const sum = dailyHours.reduce((a, b) => a + b, 0);
      return {
        dailyHours,
        averageHours: Math.round((sum / dailyHours.length) * 10) / 10,
        hasData: true,
      };
    } catch (error) {
      console.error('Error screen time insight:', error);
      return { dailyHours: [0, 0, 0, 0, 0, 0, 0], averageHours: null, hasData: false };
    }
  }
}

export const stage3InsightService = new Stage3InsightService();
