import { dailyHabitsService } from './dailyHabitsService';
import TimePeriodUtils from './timePeriodUtils';
import { DailyHabits, HabitStreak } from '../types/database';

export interface WeeklyPattern {
  monday: { completionRate: number; totalDays: number; completedDays: number };
  tuesday: { completionRate: number; totalDays: number; completedDays: number };
  wednesday: { completionRate: number; totalDays: number; completedDays: number };
  thursday: { completionRate: number; totalDays: number; completedDays: number };
  friday: { completionRate: number; totalDays: number; completedDays: number };
  saturday: { completionRate: number; totalDays: number; completedDays: number };
  sunday: { completionRate: number; totalDays: number; completedDays: number };
  peakDay: string;
  consistencyScore: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface SleepCorrelation {
  sleepQualityMoodCorrelation: number;
  sleepDurationEnergyCorrelation: number;
  bedtimeConsistency: number;
  optimalBedtime: string;
  optimalWakeTime: string;
  averageSleepQuality: number;
  sleepQualityTrend: 'improving' | 'declining' | 'stable';
}

export interface HabitCompletionRate {
  overallCompletion: number;
  habitBreakdown: {
    sleep: { completion: number; streak: number; goal: number };
    water: { completion: number; streak: number; goal: number };
    run: { completion: number; streak: number; goal: number };
    gym: { completion: number; streak: number; goal: number };
    reflect: { completion: number; streak: number; goal: number };
    cold_shower: { completion: number; streak: number; goal: number };
  };
  topPerforming: string[];
  needsAttention: string[];
  weeklyGoal: number;
  weeklyCompleted: number;
}

export interface ThreeWeekPulse {
  thisWeek: { label: string; completionRate: number; startDate: string; endDate: string };
  lastWeek: {
    label: string;
    completionRate: number;
    deltaVsPrevious: number;
    startDate: string;
    endDate: string;
  };
  twoWeeksAgo: {
    label: string;
    completionRate: number;
    deltaVsPrevious: number;
    startDate: string;
    endDate: string;
  };
  highlights: string[];
}

export interface EnergyInsight {
  average: number | null;
  bestDay: string | null;
  sampleDays: number;
}

export interface SleepSnapshot {
  averageHours: number | null;
  averageQuality: number | null;
  bedtimeConsistency: number;
  optimalBedtime: string;
  optimalWakeTime: string;
  nightsLogged: number;
}

export interface MovementSummary {
  runActiveDays: number;
  runSessions: number;
  totalDistanceKm: number;
  gymSessions: number;
  topTrainingType: string | null;
  restDayRatio: number | null;
  daysInPeriod: number;
  takeaway: string;
}

export interface WeeklySummary {
  currentWeek: {
    totalHabits: number;
    completedHabits: number;
    completionRate: number;
    streaks: HabitStreak[];
  };
  previousWeek: {
    totalHabits: number;
    completedHabits: number;
    completionRate: number;
  };
  improvement: number;
  highlights: string[];
  recommendations: string[];
}

export interface OptimalTimes {
  optimalBedtime: string;
  optimalWakeTime: string;
  bestExerciseTime: string;
  bestWaterIntakeTime: string;
  consistencyScore: number;
}

export interface CrossHabitCorrelation {
  sleepToMood: number;
  sleepToEnergy: number;
  sleepToExercise: number;
  waterToEnergy: number;
  waterToMood: number;
  exerciseToSleep: number;
  coldShowerToMood: number;
  coldShowerToEnergy: number;
  meditationToStress: number; // Coming soon
  meditationToFocus: number; // Coming soon
}

export interface CorrelationInsight {
  type: 'positive' | 'negative' | 'neutral';
  strength: 'strong' | 'moderate' | 'weak';
  title: string;
  habit1: string;
  habit2: string;
  description: string;
  recommendation: string;
  dataPoints: number;
  /** Pearson r, -1..1 */
  coefficient: number;
}

class AnalyticsService {
  /**
   * Calculate weekly patterns for a specific habit over the last N calendar days.
   */
  async calculateWeeklyPatterns(userId: string, habitType: string, days: number = 28): Promise<WeeklyPattern> {
    try {
      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - days + 1);
      const endDate = TimePeriodUtils.toLocalDateString(end);
      const startDate = TimePeriodUtils.toLocalDateString(start);

      const allRows = await dailyHabitsService.getDailyHabitsRange(userId, startDate, endDate);
      const byDate = new Map(allRows.map((r) => [r.date, r]));

      const dayCounts = {
        monday: { completed: 0, total: 0 },
        tuesday: { completed: 0, total: 0 },
        wednesday: { completed: 0, total: 0 },
        thursday: { completed: 0, total: 0 },
        friday: { completed: 0, total: 0 },
        saturday: { completed: 0, total: 0 },
        sunday: { completed: 0, total: 0 },
      };

      for (const dateStr of TimePeriodUtils.eachDate(startDate, endDate)) {
        if (dateStr > endDate) continue;
        const dayOfWeek = TimePeriodUtils.getLocalDayName(dateStr) as keyof typeof dayCounts;
        if (!dayCounts[dayOfWeek]) continue;
        dayCounts[dayOfWeek].total++;
        const record = byDate.get(dateStr);
        if (record && this.isHabitCompleted(record, habitType)) {
          dayCounts[dayOfWeek].completed++;
        }
      }

      const habitHistory = allRows.filter((r) => this.isHabitCompleted(r, habitType));

      return {
        monday: {
          completionRate: this.calculateRate(dayCounts.monday),
          totalDays: dayCounts.monday.total,
          completedDays: dayCounts.monday.completed,
        },
        tuesday: {
          completionRate: this.calculateRate(dayCounts.tuesday),
          totalDays: dayCounts.tuesday.total,
          completedDays: dayCounts.tuesday.completed,
        },
        wednesday: {
          completionRate: this.calculateRate(dayCounts.wednesday),
          totalDays: dayCounts.wednesday.total,
          completedDays: dayCounts.wednesday.completed,
        },
        thursday: {
          completionRate: this.calculateRate(dayCounts.thursday),
          totalDays: dayCounts.thursday.total,
          completedDays: dayCounts.thursday.completed,
        },
        friday: {
          completionRate: this.calculateRate(dayCounts.friday),
          totalDays: dayCounts.friday.total,
          completedDays: dayCounts.friday.completed,
        },
        saturday: {
          completionRate: this.calculateRate(dayCounts.saturday),
          totalDays: dayCounts.saturday.total,
          completedDays: dayCounts.saturday.completed,
        },
        sunday: {
          completionRate: this.calculateRate(dayCounts.sunday),
          totalDays: dayCounts.sunday.total,
          completedDays: dayCounts.sunday.completed,
        },
        peakDay: this.findPeakDay(dayCounts),
        consistencyScore: this.calculateConsistencyScore(dayCounts),
        trend: this.calculateTrend(habitHistory, habitType),
      };
    } catch (error) {
      console.error('Error calculating weekly patterns:', error);
      return this.getDefaultWeeklyPattern();
    }
  }

  /**
   * Analyze sleep correlations with mood and energy
   */
  async analyzeSleepCorrelations(userId: string, days: number = 30): Promise<SleepCorrelation> {
    try {
      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - days + 1);
      const endDate = TimePeriodUtils.toLocalDateString(end);
      const startDate = TimePeriodUtils.toLocalDateString(start);

      const allRows = await dailyHabitsService.getDailyHabitsRange(userId, startDate, endDate);
      const habitHistory = allRows.filter((r) => this.isHabitCompleted(r, 'sleep'));
      const reflectHistory = allRows.filter((r) => this.isHabitCompleted(r, 'reflect'));
      
      // Filter records with both sleep and mood data
      const sleepMoodData = habitHistory.filter(sleep => {
        const reflect = reflectHistory.find(r => r.date === sleep.date);
        return sleep.sleep_quality && reflect?.reflect_mood;
      });

      const sleepEnergyData = habitHistory.filter(sleep => {
        const reflect = reflectHistory.find(r => r.date === sleep.date);
        return sleep.sleep_hours && reflect?.reflect_energy;
      });

      // Calculate correlations
      const sleepQualityMoodCorrelation = this.calculateCorrelation(
        sleepMoodData.map(s => s.sleep_quality!),
        sleepMoodData.map(s => reflectHistory.find(r => r.date === s.date)!.reflect_mood!)
      );

      const sleepDurationEnergyCorrelation = this.calculateCorrelation(
        sleepEnergyData.map(s => s.sleep_hours!),
        sleepEnergyData.map(s => reflectHistory.find(r => r.date === s.date)!.reflect_energy!)
      );

      // Calculate bedtime consistency
      const bedtimes = habitHistory
        .filter(h => h.sleep_bedtime_hours !== null && h.sleep_bedtime_minutes !== null)
        .map(h => h.sleep_bedtime_hours! * 60 + h.sleep_bedtime_minutes!);
      
      const bedtimeConsistency = bedtimes.length > 0 ? this.calculateConsistency(bedtimes) : 0;

      // Find optimal times
      const optimalBedtime = this.findOptimalBedtime(habitHistory);
      const optimalWakeTime = this.findOptimalWakeTime(habitHistory);

      // Calculate average sleep quality
      const sleepQualities = habitHistory
        .filter(h => h.sleep_quality !== null)
        .map(h => h.sleep_quality!);
      
      const averageSleepQuality = sleepQualities.length > 0 
        ? sleepQualities.reduce((sum, quality) => sum + quality, 0) / sleepQualities.length 
        : 0;

      return {
        sleepQualityMoodCorrelation,
        sleepDurationEnergyCorrelation,
        bedtimeConsistency,
        optimalBedtime,
        optimalWakeTime,
        averageSleepQuality,
        sleepQualityTrend: this.calculateSleepQualityTrend(habitHistory)
      };
    } catch (error) {
      console.error('Error analyzing sleep correlations:', error);
      return this.getDefaultSleepCorrelation();
    }
  }

  /**
   * Calculate habit completion rates for a period (calendar-day denominators).
   */
  async calculateHabitCompletionRate(userId: string, period: 'past7' | 'currentWeek' | 'last30' = 'past7'): Promise<HabitCompletionRate> {
    try {
      const timePeriod = TimePeriodUtils.getPeriodByType(period);
      const today = TimePeriodUtils.toLocalDateString(new Date());
      const effectiveEnd = timePeriod.endDate > today ? today : timePeriod.endDate;
      const calendarDays = TimePeriodUtils.eachDate(timePeriod.startDate, effectiveEnd);
      const daysInPeriod = calendarDays.length || 1;

      const habitTypes = ['sleep', 'water', 'run', 'gym', 'reflect', 'cold_shower'];
      const allRows = await dailyHabitsService.getDailyHabitsRange(
        userId,
        timePeriod.startDate,
        effectiveEnd
      );
      const byDate = new Map(allRows.map((r) => [r.date, r]));

      const habitBreakdown: any = {};
      let totalCompleted = 0;

      for (const habitType of habitTypes) {
        let completed = 0;
        for (const dateStr of calendarDays) {
          const record = byDate.get(dateStr);
          if (record && this.isHabitCompleted(record, habitType)) completed++;
        }
        const streak = await dailyHabitsService.getHabitStreak(userId, habitType);

        habitBreakdown[habitType] = {
          completion: (completed / daysInPeriod) * 100,
          streak: streak.current_streak,
          goal: this.getHabitGoal(habitType),
        };

        totalCompleted += completed;
      }

      const totalPossible = daysInPeriod * habitTypes.length;

      const sortedHabits = Object.entries(habitBreakdown).sort(
        ([, a]: any, [, b]: any) => b.completion - a.completion
      );

      const topPerforming = sortedHabits.slice(0, 2).map(([habit]) => habit);
      const needsAttention = sortedHabits.slice(-2).reverse().map(([habit]) => habit);

      return {
        overallCompletion: totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0,
        habitBreakdown,
        topPerforming,
        needsAttention,
        weeklyGoal: totalPossible,
        weeklyCompleted: totalCompleted,
      };
    } catch (error) {
      console.error('Error calculating habit completion rate:', error);
      return this.getDefaultHabitCompletionRate();
    }
  }

  /**
   * Get completion rates for all time periods
   */
  async getMultiPeriodStats(userId: string): Promise<{
    past7: HabitCompletionRate;
    currentWeek: HabitCompletionRate;
    last30: HabitCompletionRate;
  }> {
    try {
      const [past7, currentWeek, last30] = await Promise.all([
        this.calculateHabitCompletionRate(userId, 'past7'),
        this.calculateHabitCompletionRate(userId, 'currentWeek'),
        this.calculateHabitCompletionRate(userId, 'last30')
      ]);

      return { past7, currentWeek, last30 };
    } catch (error) {
      console.error('Error getting multi-period stats:', error);
      return {
        past7: this.getDefaultHabitCompletionRate(),
        currentWeek: this.getDefaultHabitCompletionRate(),
        last30: this.getDefaultHabitCompletionRate()
      };
    }
  }

  /**
   * Calendar week bounds: offsetWeeks 0 = this Mon→Sun, -1 = previous Mon–Sun, etc.
   * For offset 0, endDate is capped at today.
   */
  getCalendarWeekRange(offsetWeeks: number = 0): { startDate: string; endDate: string; label: string } {
    const today = new Date();
    const thisWeekStart = TimePeriodUtils.getWeekStart(today);
    const start = new Date(thisWeekStart);
    start.setDate(start.getDate() + offsetWeeks * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const todayStr = TimePeriodUtils.toLocalDateString(today);
    let endDate = TimePeriodUtils.toLocalDateString(end);
    if (offsetWeeks === 0 && endDate > todayStr) endDate = todayStr;

    const labels = ['This week', 'Last week', '2 weeks ago'];
    const label =
      offsetWeeks === 0 ? labels[0] : offsetWeeks === -1 ? labels[1] : offsetWeeks === -2 ? labels[2] : `Week ${offsetWeeks}`;

    return {
      startDate: TimePeriodUtils.toLocalDateString(start),
      endDate,
      label,
    };
  }

  private async completionForDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    overallCompletion: number;
    habitBreakdown: Record<string, number>;
    daysInPeriod: number;
    completedCount: number;
    totalPossible: number;
  }> {
    const habitTypes = ['sleep', 'water', 'run', 'gym', 'reflect', 'cold_shower'];
    const calendarDays = TimePeriodUtils.eachDate(startDate, endDate);
    const daysInPeriod = calendarDays.length || 1;
    const allRows = await dailyHabitsService.getDailyHabitsRange(userId, startDate, endDate);
    const byDate = new Map(allRows.map((r) => [r.date, r]));

    const habitBreakdown: Record<string, number> = {};
    let totalCompleted = 0;

    for (const habitType of habitTypes) {
      let completed = 0;
      for (const dateStr of calendarDays) {
        const record = byDate.get(dateStr);
        if (record && this.isHabitCompleted(record, habitType)) completed++;
      }
      habitBreakdown[habitType] = (completed / daysInPeriod) * 100;
      totalCompleted += completed;
    }

    const totalPossible = daysInPeriod * habitTypes.length;
    return {
      overallCompletion: totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0,
      habitBreakdown,
      daysInPeriod,
      completedCount: totalCompleted,
      totalPossible,
    };
  }

  /**
   * Three calendar-week pulse: this Mon→today, previous Mon–Sun, week before that.
   */
  async getThreeWeekPulse(userId: string): Promise<ThreeWeekPulse> {
    try {
      const thisWeek = this.getCalendarWeekRange(0);
      const lastWeek = this.getCalendarWeekRange(-1);
      const twoWeeksAgo = this.getCalendarWeekRange(-2);

      const [current, previous, older] = await Promise.all([
        this.completionForDateRange(userId, thisWeek.startDate, thisWeek.endDate),
        this.completionForDateRange(userId, lastWeek.startDate, lastWeek.endDate),
        this.completionForDateRange(userId, twoWeeksAgo.startDate, twoWeeksAgo.endDate),
      ]);

      const habitTypes = ['sleep', 'water', 'run', 'gym', 'reflect', 'cold_shower'];
      const deltas = habitTypes
        .map((habit) => ({
          habit,
          delta: (current.habitBreakdown[habit] || 0) - (previous.habitBreakdown[habit] || 0),
        }))
        .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

      const highlights: string[] = [];
      for (const item of deltas.slice(0, 2)) {
        if (Math.abs(item.delta) < 1) continue;
        const name = this.formatHabitLabel(item.habit);
        const pts = Math.round(Math.abs(item.delta));
        highlights.push(
          item.delta >= 0
            ? `${name} ↑${pts} pts vs last week`
            : `${name} ↓${pts} pts vs last week`
        );
      }

      return {
        thisWeek: {
          label: thisWeek.label,
          completionRate: current.overallCompletion,
          startDate: thisWeek.startDate,
          endDate: thisWeek.endDate,
        },
        lastWeek: {
          label: lastWeek.label,
          completionRate: previous.overallCompletion,
          deltaVsPrevious: current.overallCompletion - previous.overallCompletion,
          startDate: lastWeek.startDate,
          endDate: lastWeek.endDate,
        },
        twoWeeksAgo: {
          label: twoWeeksAgo.label,
          completionRate: older.overallCompletion,
          deltaVsPrevious: previous.overallCompletion - older.overallCompletion,
          startDate: twoWeeksAgo.startDate,
          endDate: twoWeeksAgo.endDate,
        },
        highlights,
      };
    } catch (error) {
      console.error('Error getting three-week pulse:', error);
      return this.getDefaultThreeWeekPulse();
    }
  }

  /**
   * Energy insight for current calendar week (Mon → today).
   */
  async getEnergyInsight(userId: string): Promise<EnergyInsight> {
    try {
      const range = this.getCalendarWeekRange(0);
      const rows = await dailyHabitsService.getDailyHabitsRange(
        userId,
        range.startDate,
        range.endDate
      );

      const withEnergy = rows.filter((r) => r.reflect_energy != null && Number(r.reflect_energy) > 0);
      if (withEnergy.length === 0) {
        return { average: null, bestDay: null, sampleDays: 0 };
      }

      const sum = withEnergy.reduce((acc, r) => acc + Number(r.reflect_energy), 0);
      const average = sum / withEnergy.length;

      const byDay: Record<string, { total: number; count: number }> = {};
      for (const r of withEnergy) {
        const day = TimePeriodUtils.getLocalDayName(r.date);
        if (!byDay[day]) byDay[day] = { total: 0, count: 0 };
        byDay[day].total += Number(r.reflect_energy);
        byDay[day].count += 1;
      }

      let bestDay: string | null = null;
      let bestAvg = -1;
      for (const [day, stats] of Object.entries(byDay)) {
        const avg = stats.total / stats.count;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestDay = day;
        }
      }

      return {
        average: Math.round(average * 10) / 10,
        bestDay,
        sampleDays: withEnergy.length,
      };
    } catch (error) {
      console.error('Error getting energy insight:', error);
      return { average: null, bestDay: null, sampleDays: 0 };
    }
  }

  /**
   * Sleep snapshot for current calendar week (Mon → today).
   */
  async getSleepSnapshot(userId: string): Promise<SleepSnapshot> {
    try {
      const range = this.getCalendarWeekRange(0);
      const rows = await dailyHabitsService.getDailyHabitsRange(
        userId,
        range.startDate,
        range.endDate
      );
      const sleepRows = rows.filter((r) => this.isHabitCompleted(r, 'sleep'));

      if (sleepRows.length === 0) {
        return {
          averageHours: null,
          averageQuality: null,
          bedtimeConsistency: 0,
          optimalBedtime: '—',
          optimalWakeTime: '—',
          nightsLogged: 0,
        };
      }

      const hours = sleepRows
        .map((r) => (r.sleep_hours != null ? Number(r.sleep_hours) : null))
        .filter((h): h is number => h != null && h > 0);
      const qualities = sleepRows
        .map((r) => (r.sleep_quality != null ? Number(r.sleep_quality) : null))
        .filter((q): q is number => q != null);

      const bedtimes = sleepRows
        .filter((h) => h.sleep_bedtime_hours != null && h.sleep_bedtime_minutes != null)
        .map((h) => h.sleep_bedtime_hours! * 60 + h.sleep_bedtime_minutes!);

      return {
        averageHours:
          hours.length > 0
            ? Math.round((hours.reduce((a, b) => a + b, 0) / hours.length) * 10) / 10
            : null,
        averageQuality:
          qualities.length > 0
            ? Math.round(qualities.reduce((a, b) => a + b, 0) / qualities.length)
            : null,
        bedtimeConsistency: bedtimes.length > 0 ? Math.round(this.calculateConsistency(bedtimes)) : 0,
        optimalBedtime: this.findOptimalBedtime(sleepRows),
        optimalWakeTime: this.findOptimalWakeTime(sleepRows),
        nightsLogged: sleepRows.length,
      };
    } catch (error) {
      console.error('Error getting sleep snapshot:', error);
      return {
        averageHours: null,
        averageQuality: null,
        bedtimeConsistency: 0,
        optimalBedtime: '—',
        optimalWakeTime: '—',
        nightsLogged: 0,
      };
    }
  }

  /**
   * Run + gym movement summary for current calendar week.
   */
  async getMovementSummary(userId: string): Promise<MovementSummary> {
    try {
      const range = this.getCalendarWeekRange(0);
      const calendarDays = TimePeriodUtils.eachDate(range.startDate, range.endDate);
      const daysInPeriod = calendarDays.length || 1;
      const rows = await dailyHabitsService.getDailyHabitsRange(
        userId,
        range.startDate,
        range.endDate
      );
      const byDate = new Map(rows.map((r) => [r.date, r]));

      let runActiveDays = 0;
      let runSessions = 0;
      let totalDistanceKm = 0;
      let gymSessions = 0;
      let restDays = 0;
      const typeCounts: Record<string, number> = {};

      for (const dateStr of calendarDays) {
        const record = byDate.get(dateStr);
        const runActive = record ? this.isHabitCompleted(record, 'run') : false;
        const gymActive = record ? this.isHabitCompleted(record, 'gym') : false;

        if (runActive) {
          runActiveDays++;
          runSessions++;
          if (record?.run_distance != null) {
            totalDistanceKm += Number(record.run_distance) || 0;
          }
        }
        if (gymActive) {
          gymSessions++;
          const types = record?.gym_training_types || [];
          for (const t of types) {
            const key = (t || 'Other').trim() || 'Other';
            typeCounts[key] = (typeCounts[key] || 0) + 1;
          }
        }
        if (
          record &&
          (record.run_day_type === 'rest' || record.gym_day_type === 'rest') &&
          !runActive &&
          !gymActive
        ) {
          restDays++;
        }
      }

      let topTrainingType: string | null = null;
      let topCount = 0;
      for (const [type, count] of Object.entries(typeCounts)) {
        if (count > topCount) {
          topCount = count;
          topTrainingType = type;
        }
      }

      const activeMoveDays = new Set(
        calendarDays.filter((d) => {
          const r = byDate.get(d);
          return r && (this.isHabitCompleted(r, 'run') || this.isHabitCompleted(r, 'gym'));
        })
      ).size;

      let takeaway = 'Log a run or gym session to see your movement pattern.';
      if (activeMoveDays > 0) {
        if (topTrainingType) {
          takeaway = `Most gym days are ${topTrainingType}.`;
        } else if (runSessions > gymSessions) {
          takeaway = `Running leads this week with ${runSessions} session${runSessions === 1 ? '' : 's'}.`;
        } else if (gymSessions > 0) {
          takeaway = `${gymSessions} gym session${gymSessions === 1 ? '' : 's'} this week.`;
        } else {
          takeaway = `${activeMoveDays} active move day${activeMoveDays === 1 ? '' : 's'} this week.`;
        }
      }

      return {
        runActiveDays,
        runSessions,
        totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
        gymSessions,
        topTrainingType,
        restDayRatio: daysInPeriod > 0 ? Math.round((restDays / daysInPeriod) * 100) : null,
        daysInPeriod,
        takeaway,
      };
    } catch (error) {
      console.error('Error getting movement summary:', error);
      return {
        runActiveDays: 0,
        runSessions: 0,
        totalDistanceKm: 0,
        gymSessions: 0,
        topTrainingType: null,
        restDayRatio: null,
        daysInPeriod: 0,
        takeaway: 'Log a run or gym session to see your movement pattern.',
      };
    }
  }

  formatHabitLabel(habit: string): string {
    return habit.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /**
   * Generate weekly summary
   */
  async generateWeeklySummary(userId: string): Promise<WeeklySummary> {
    try {
      const thisWeek = this.getCalendarWeekRange(0);
      const lastWeek = this.getCalendarWeekRange(-1);

      const [current, previous] = await Promise.all([
        this.completionForDateRange(userId, thisWeek.startDate, thisWeek.endDate),
        this.completionForDateRange(userId, lastWeek.startDate, lastWeek.endDate),
      ]);

      const habitTypes = ['sleep', 'water', 'run', 'gym', 'reflect', 'cold_shower'];
      const streaks = await Promise.all(
        habitTypes.map((habitType) => dailyHabitsService.getHabitStreak(userId, habitType))
      );

      const currentWeekData = await dailyHabitsService.getDailyHabitsRange(
        userId,
        thisWeek.startDate,
        thisWeek.endDate
      );

      return {
        currentWeek: {
          totalHabits: current.totalPossible,
          completedHabits: current.completedCount,
          completionRate: current.overallCompletion,
          streaks: streaks.filter((s) => s.current_streak > 0),
        },
        previousWeek: {
          totalHabits: previous.totalPossible,
          completedHabits: previous.completedCount,
          completionRate: previous.overallCompletion,
        },
        improvement: current.overallCompletion - previous.overallCompletion,
        highlights: this.generateHighlights(currentWeekData, streaks),
        recommendations: this.generateRecommendations(currentWeekData, streaks),
      };
    } catch (error) {
      console.error('Error generating weekly summary:', error);
      return this.getDefaultWeeklySummary();
    }
  }

  /**
   * Analyze optimal times for habits
   */
  async analyzeOptimalTimes(userId: string, habitType: string): Promise<OptimalTimes> {
    try {
      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - 29);
      const endDate = TimePeriodUtils.toLocalDateString(end);
      const startDate = TimePeriodUtils.toLocalDateString(start);
      
      const habitHistory = await dailyHabitsService.getHabitHistory(userId, habitType, startDate, endDate, {
        completedOnly: false,
      });
      
      // For sleep, analyze bedtime and wake time patterns
      if (habitType === 'sleep') {
        const bedtimes = habitHistory
          .filter(h => h.sleep_bedtime_hours !== null && h.sleep_bedtime_minutes !== null)
          .map(h => ({ hours: h.sleep_bedtime_hours!, minutes: h.sleep_bedtime_minutes!, quality: h.sleep_quality || 0 }));
        
        const wakeTimes = habitHistory
          .filter(h => h.sleep_wakeup_hours !== null && h.sleep_wakeup_minutes !== null)
          .map(h => ({ hours: h.sleep_wakeup_hours!, minutes: h.sleep_wakeup_minutes!, quality: h.sleep_quality || 0 }));

        const optimalBedtime = this.findOptimalTime(bedtimes, 'bedtime');
        const optimalWakeTime = this.findOptimalTime(wakeTimes, 'waketime');

        return {
          optimalBedtime,
          optimalWakeTime,
          bestExerciseTime: '18:00', // Default
          bestWaterIntakeTime: '09:00', // Default
          consistencyScore: this.calculateConsistencyScore(bedtimes.map(b => b.hours * 60 + b.minutes))
        };
      }

      // Default optimal times
      return {
        optimalBedtime: '22:30',
        optimalWakeTime: '06:30',
        bestExerciseTime: '18:00',
        bestWaterIntakeTime: '09:00',
        consistencyScore: 0.8
      };
    } catch (error) {
      console.error('Error analyzing optimal times:', error);
      return this.getDefaultOptimalTimes();
    }
  }

  // Helper methods
  private isHabitCompleted(record: DailyHabits, habitType: string): boolean {
    switch (habitType) {
      case 'sleep':
        return (
          (record.sleep_hours != null && Number(record.sleep_hours) > 0) ||
          record.sleep_quality != null ||
          record.sleep_bedtime_hours != null
        );
      case 'water':
        return record.water_intake != null && Number(record.water_intake) > 0;
      case 'run':
        return (
          record.run_day_type === 'active' ||
          !!record.run_distance ||
          !!record.run_duration
        );
      case 'gym':
        return (
          record.gym_day_type === 'active' ||
          !!(record.gym_training_types && record.gym_training_types.length)
        );
      case 'reflect':
        return (
          record.reflect_mood != null ||
          !!record.reflect_what_went_well ||
          !!record.reflect_nothing_to_change
        );
      case 'cold_shower':
        return record.cold_shower_completed === true;
      default:
        return false;
    }
  }

  private isAnyHabitCompleted(record: DailyHabits): boolean {
    return this.isHabitCompleted(record, 'sleep') ||
           this.isHabitCompleted(record, 'water') ||
           this.isHabitCompleted(record, 'run') ||
           this.isHabitCompleted(record, 'gym') ||
           this.isHabitCompleted(record, 'reflect') ||
           this.isHabitCompleted(record, 'cold_shower');
  }

  private calculateRate(dayCount: { completed: number; total: number }): number {
    return dayCount.total > 0 ? (dayCount.completed / dayCount.total) * 100 : 0;
  }

  private findPeakDay(dayCounts: any): string {
    try {
      const rates = Object.entries(dayCounts).map(([day, count]: [string, any]) => ({
        day,
        rate: this.calculateRate(count),
        completed: count.completed || 0,
        total: count.total || 0,
      }));
      // Prefer highest completion rate; tie-break by most completed days
      return rates.reduce((max, current) => {
        if (current.rate > max.rate) return current;
        if (current.rate === max.rate && current.completed > max.completed) return current;
        return max;
      }).day;
    } catch (error) {
      console.error('Error finding peak day:', error);
      return 'monday';
    }
  }

  private calculateConsistencyScore(dayCounts: any): number {
    try {
      // Check if we have enough data for meaningful analysis
      const totalDays = Object.values(dayCounts).reduce((sum: number, count: any) => sum + count.total, 0);
      const totalCompleted = Object.values(dayCounts).reduce((sum: number, count: any) => sum + count.completed, 0);
      
      // Require at least 14 days of data (2 weeks) for meaningful consistency analysis
      if (totalDays < 14) {
        return 0;
      }
      
      // Require at least 7 completed days to have any meaningful pattern
      if (totalCompleted < 7) {
        return 0;
      }
      
      const rates = Object.values(dayCounts).map((count: any) => this.calculateRate(count));
      if (rates.length === 0) return 0;
      
      const average = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
      const variance = rates.reduce((sum, rate) => sum + Math.pow(rate - average, 2), 0) / rates.length;
      return Math.max(0, 100 - Math.sqrt(variance));
    } catch (error) {
      console.error('Error calculating consistency score:', error);
      return 0;
    }
  }

  private calculateTrend(history: DailyHabits[], habitType: string): 'improving' | 'declining' | 'stable' {
    if (history.length < 7) return 'stable';
    
    const recent = history.slice(0, 7);
    const older = history.slice(7, 14);
    
    const recentAvg = recent.reduce((sum, record) => sum + (this.getHabitValue(record, habitType) || 0), 0) / recent.length;
    const olderAvg = older.reduce((sum, record) => sum + (this.getHabitValue(record, habitType) || 0), 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    if (Math.abs(difference) < 0.1) return 'stable';
    return difference > 0 ? 'improving' : 'declining';
  }

  private getHabitValue(record: DailyHabits, habitType: string): number | null {
    switch (habitType) {
      case 'sleep': return record.sleep_quality;
      case 'water': return record.water_intake;
      case 'run': return record.run_distance;
      case 'gym': return record.gym_training_types?.length || 0;
      case 'reflect': return record.reflect_mood;
      case 'cold_shower': return record.cold_shower_completed ? 1 : 0;
      default: return null;
    }
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) return 0;
    
    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : Math.max(-1, Math.min(1, numerator / denominator));
  }

  private calculateConsistency(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    return Math.max(0, 100 - (standardDeviation / mean) * 100);
  }

  private findOptimalBedtime(history: DailyHabits[]): string {
    const bedtimes = history
      .filter(h => h.sleep_bedtime_hours !== null && h.sleep_bedtime_minutes !== null && h.sleep_quality !== null)
      .map(h => ({ time: h.sleep_bedtime_hours! * 60 + h.sleep_bedtime_minutes!, quality: h.sleep_quality! }));
    
    return this.findOptimalTime(bedtimes, 'bedtime');
  }

  private findOptimalWakeTime(history: DailyHabits[]): string {
    const wakeTimes = history
      .filter(h => h.sleep_wakeup_hours !== null && h.sleep_wakeup_minutes !== null && h.sleep_quality !== null)
      .map(h => ({ time: h.sleep_wakeup_hours! * 60 + h.sleep_wakeup_minutes!, quality: h.sleep_quality! }));
    
    return this.findOptimalTime(wakeTimes, 'waketime');
  }

  private findOptimalTime(times: { time: number; quality: number }[], type: string): string {
    if (times.length === 0) return type === 'bedtime' ? '22:30' : '06:30';
    
    // Group by time and find average quality
    const timeGroups: { [key: number]: number[] } = {};
    times.forEach(({ time, quality }) => {
      if (!timeGroups[time]) timeGroups[time] = [];
      timeGroups[time].push(quality);
    });
    
    const timeAverages = Object.entries(timeGroups).map(([time, qualities]) => ({
      time: parseInt(time),
      avgQuality: qualities.reduce((sum, q) => sum + q, 0) / qualities.length
    }));
    
    const optimal = timeAverages.reduce((max, current) => 
      current.avgQuality > max.avgQuality ? current : max
    );
    
    const hours = Math.floor(optimal.time / 60);
    const minutes = optimal.time % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  private calculateSleepQualityTrend(history: DailyHabits[]): 'improving' | 'declining' | 'stable' {
    return this.calculateTrend(history, 'sleep');
  }

  private getHabitGoal(habitType: string): number {
    switch (habitType) {
      case 'sleep': return 80; // 80% completion goal
      case 'water': return 75;
      case 'run': return 70;
      case 'gym': return 70;
      case 'reflect': return 80;
      case 'cold_shower': return 60;
      default: return 75;
    }
  }

  private generateHighlights(data: DailyHabits[], streaks: HabitStreak[]): string[] {
    const highlights: string[] = [];
    
    // Check for perfect days
    const perfectDays = data.filter(record => this.isAnyHabitCompleted(record)).length;
    if (perfectDays > 0) {
      highlights.push(`Completed ${perfectDays} habits this week`);
    }
    
    // Check for streaks
    const topStreak = streaks.reduce((max, streak) => 
      streak.current_streak > max ? streak.current_streak : max, 0
    );
    if (topStreak > 3) {
      highlights.push(`Maintaining a ${topStreak}-day streak`);
    }
    
    return highlights.length > 0 ? highlights : ['Keep up the great work!'];
  }

  private generateRecommendations(data: DailyHabits[], streaks: HabitStreak[]): string[] {
    const recommendations: string[] = [];
    
    // Check for low streaks
    const lowStreaks = streaks.filter(s => s.current_streak < 2);
    if (lowStreaks.length > 0) {
      recommendations.push(`Try to build consistency with ${lowStreaks[0].habit_type}`);
    }
    
    return recommendations.length > 0 ? recommendations : ['You\'re doing great!'];
  }

  /**
   * Calculate cross-habit correlations over the last N calendar days.
   */
  async calculateCrossHabitCorrelations(
    userId: string,
    days: number = 30
  ): Promise<CrossHabitCorrelation & { dataPoints: number }> {
    try {
      const end = new Date();
      const start = new Date(end);
      start.setDate(start.getDate() - days + 1);
      const endDate = TimePeriodUtils.toLocalDateString(end);
      const startDate = TimePeriodUtils.toLocalDateString(start);

      const habitHistory = await dailyHabitsService.getDailyHabitsRange(userId, startDate, endDate);

      const validRecords = habitHistory.filter(
        (record) =>
          (record.sleep_hours || record.sleep_quality) &&
          (record.reflect_mood || record.reflect_energy) &&
          record.date
      );

      if (validRecords.length < 5) {
        return { ...this.getDefaultCrossHabitCorrelation(), dataPoints: validRecords.length };
      }

      const sleepToMood = this.calculateCorrelation(
        validRecords.map((r) => r.sleep_quality || r.sleep_hours || 0),
        validRecords.map((r) => r.reflect_mood || 0)
      );

      const sleepToEnergy = this.calculateCorrelation(
        validRecords.map((r) => r.sleep_quality || r.sleep_hours || 0),
        validRecords.map((r) => r.reflect_energy || 0)
      );

      const sleepToExercise = this.calculateCorrelation(
        validRecords.map((r) => r.sleep_quality || r.sleep_hours || 0),
        validRecords.map((r) => (r.run_distance || 0) + (r.gym_day_type === 'active' ? 1 : 0))
      );

      const waterToEnergy = this.calculateCorrelation(
        validRecords.map((r) => r.water_intake || 0),
        validRecords.map((r) => r.reflect_energy || 0)
      );

      const waterToMood = this.calculateCorrelation(
        validRecords.map((r) => r.water_intake || 0),
        validRecords.map((r) => r.reflect_mood || 0)
      );

      const exerciseToSleep = this.calculateCorrelation(
        validRecords.map((r) => (r.run_distance || 0) + (r.gym_day_type === 'active' ? 1 : 0)),
        validRecords.map((r) => r.sleep_quality || r.sleep_hours || 0)
      );

      const coldShowerToMood = this.calculateCorrelation(
        validRecords.map((r) => (r.cold_shower_completed ? 1 : 0)),
        validRecords.map((r) => r.reflect_mood || 0)
      );

      const coldShowerToEnergy = this.calculateCorrelation(
        validRecords.map((r) => (r.cold_shower_completed ? 1 : 0)),
        validRecords.map((r) => r.reflect_energy || 0)
      );

      return {
        sleepToMood,
        sleepToEnergy,
        sleepToExercise,
        waterToEnergy,
        waterToMood,
        exerciseToSleep,
        coldShowerToMood,
        coldShowerToEnergy,
        meditationToStress: 0,
        meditationToFocus: 0,
        dataPoints: validRecords.length,
      };
    } catch (error) {
      console.error('Error calculating cross-habit correlations:', error);
      return { ...this.getDefaultCrossHabitCorrelation(), dataPoints: 0 };
    }
  }

  private correlationStrength(value: number): 'strong' | 'moderate' | 'weak' {
    const abs = Math.abs(value);
    if (abs > 0.6) return 'strong';
    if (abs > 0.3) return 'moderate';
    return 'weak';
  }

  /**
   * Generate correlation insights for UI (includes title + habit labels).
   */
  async generateCorrelationInsights(
    userId: string,
    days: number = 30
  ): Promise<CorrelationInsight[]> {
    try {
      const correlations = await this.calculateCrossHabitCorrelations(userId, days);
      const dataPoints = correlations.dataPoints;
      const insights: CorrelationInsight[] = [];

      const pushInsight = (
        value: number,
        title: string,
        habit1: string,
        habit2: string,
        positiveDesc: string,
        negativeDesc: string,
        positiveRec: string,
        negativeRec: string
      ) => {
        if (Math.abs(value) <= 0.3) return;
        const positive = value > 0;
        insights.push({
          type: positive ? 'positive' : 'negative',
          strength: this.correlationStrength(value),
          title,
          habit1,
          habit2,
          description: positive ? positiveDesc : negativeDesc,
          recommendation: positive ? positiveRec : negativeRec,
          dataPoints,
          coefficient: Math.round(value * 100) / 100,
        });
      };

      pushInsight(
        correlations.sleepToMood,
        'Sleep & Mood',
        'Sleep',
        'Mood',
        'Better sleep quality tends to go with better mood.',
        'Sleep quality and mood move in opposite directions in your data.',
        'Keep prioritizing solid sleep for steadier mood.',
        'Review bedtime and wind-down if mood dips after poor sleep.'
      );

      pushInsight(
        correlations.waterToEnergy,
        'Water & Energy',
        'Water',
        'Energy',
        'Higher water intake tends to go with higher energy.',
        'Water intake and energy move in opposite directions in your data.',
        'Keep hydration steady through the day.',
        'Watch how timing of drinks relates to energy dips.'
      );

      pushInsight(
        correlations.exerciseToSleep,
        'Exercise & Sleep',
        'Exercise',
        'Sleep',
        'Exercise days tend to line up with better sleep.',
        'Exercise and sleep quality move in opposite directions in your data.',
        'Keep a regular move habit to support sleep.',
        'Try earlier workouts if late sessions disrupt sleep.'
      );

      pushInsight(
        correlations.coldShowerToMood,
        'Cold Shower & Mood',
        'Cold shower',
        'Mood',
        'Cold shower days tend to line up with better mood.',
        'Cold showers and mood move in opposite directions in your data.',
        'Cold showers may be a useful mood boost for you.',
        'Experiment with timing if cold showers feel draining.'
      );

      return insights;
    } catch (error) {
      console.error('Error generating correlation insights:', error);
      return [];
    }
  }

  // Default return methods for error handling
  private getDefaultWeeklyPattern(): WeeklyPattern {
    return {
      monday: { completionRate: 0, totalDays: 0, completedDays: 0 },
      tuesday: { completionRate: 0, totalDays: 0, completedDays: 0 },
      wednesday: { completionRate: 0, totalDays: 0, completedDays: 0 },
      thursday: { completionRate: 0, totalDays: 0, completedDays: 0 },
      friday: { completionRate: 0, totalDays: 0, completedDays: 0 },
      saturday: { completionRate: 0, totalDays: 0, completedDays: 0 },
      sunday: { completionRate: 0, totalDays: 0, completedDays: 0 },
      peakDay: 'monday',
      consistencyScore: 0,
      trend: 'stable'
    };
  }

  private getDefaultSleepCorrelation(): SleepCorrelation {
    return {
      sleepQualityMoodCorrelation: 0,
      sleepDurationEnergyCorrelation: 0,
      bedtimeConsistency: 0,
      optimalBedtime: '22:30',
      optimalWakeTime: '06:30',
      averageSleepQuality: 0,
      sleepQualityTrend: 'stable'
    };
  }

  private getDefaultHabitCompletionRate(): HabitCompletionRate {
    return {
      overallCompletion: 0,
      habitBreakdown: {
        sleep: { completion: 0, streak: 0, goal: 80 },
        water: { completion: 0, streak: 0, goal: 75 },
        run: { completion: 0, streak: 0, goal: 70 },
        gym: { completion: 0, streak: 0, goal: 70 },
        reflect: { completion: 0, streak: 0, goal: 80 },
        cold_shower: { completion: 0, streak: 0, goal: 60 }
      },
      topPerforming: [],
      needsAttention: [],
      weeklyGoal: 21,
      weeklyCompleted: 0
    };
  }

  private getDefaultThreeWeekPulse(): ThreeWeekPulse {
    const empty = { label: '', completionRate: 0, startDate: '', endDate: '' };
    return {
      thisWeek: { ...empty, label: 'This week' },
      lastWeek: { ...empty, label: 'Last week', deltaVsPrevious: 0 },
      twoWeeksAgo: { ...empty, label: '2 weeks ago', deltaVsPrevious: 0 },
      highlights: [],
    };
  }

  private getDefaultWeeklySummary(): WeeklySummary {
    return {
      currentWeek: {
        totalHabits: 0,
        completedHabits: 0,
        completionRate: 0,
        streaks: []
      },
      previousWeek: {
        totalHabits: 0,
        completedHabits: 0,
        completionRate: 0
      },
      improvement: 0,
      highlights: ['Start tracking your habits to see insights!'],
      recommendations: ['Complete your first habit to get started']
    };
  }

  private getDefaultOptimalTimes(): OptimalTimes {
    return {
      optimalBedtime: '22:30',
      optimalWakeTime: '06:30',
      bestExerciseTime: '18:00',
      bestWaterIntakeTime: '09:00',
      consistencyScore: 0
    };
  }

  private getDefaultCrossHabitCorrelation(): CrossHabitCorrelation {
    return {
      sleepToMood: 0,
      sleepToEnergy: 0,
      sleepToExercise: 0,
      waterToEnergy: 0,
      waterToMood: 0,
      exerciseToSleep: 0,
      coldShowerToMood: 0,
      coldShowerToEnergy: 0,
      meditationToStress: 0, // Coming soon
      meditationToFocus: 0, // Coming soon
    };
  }
}

export const analyticsService = new AnalyticsService();
