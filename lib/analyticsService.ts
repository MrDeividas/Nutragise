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
  description: string;
  recommendation: string;
  dataPoints: number;
}

class AnalyticsService {
  /**
   * Calculate weekly patterns for a specific habit
   */
  async calculateWeeklyPatterns(userId: string, habitType: string, weeks: number = 4): Promise<WeeklyPattern> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - (weeks * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      
      const habitHistory = await dailyHabitsService.getHabitHistory(userId, habitType, startDate, endDate);
      
      // Initialize day counters
      const dayCounts = {
        monday: { completed: 0, total: 0 },
        tuesday: { completed: 0, total: 0 },
        wednesday: { completed: 0, total: 0 },
        thursday: { completed: 0, total: 0 },
        friday: { completed: 0, total: 0 },
        saturday: { completed: 0, total: 0 },
        sunday: { completed: 0, total: 0 }
      };

      // Count completions by day of week
      habitHistory.forEach(record => {
        try {
          // Validate date string format first
          if (!record.date || typeof record.date !== 'string') {
            return;
          }
          
          const date = new Date(record.date);
          
          // Skip future dates and invalid dates
          const today = new Date();
          if (date > today || isNaN(date.getTime())) {
            return;
          }
          
          // Use getDay() instead of toLocaleDateString for better compatibility
          const dayIndex = date.getDay();
          const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const dayOfWeek = dayNames[dayIndex] as keyof typeof dayCounts;
          
          if (dayCounts[dayOfWeek]) {
            dayCounts[dayOfWeek].total++;
            
            if (this.isHabitCompleted(record, habitType)) {
              dayCounts[dayOfWeek].completed++;
            }
          }
        } catch (error) {
          console.error('Error processing date:', record.date, error);
        }
      });

      // Calculate completion rates
      const patterns: WeeklyPattern = {
        monday: { completionRate: this.calculateRate(dayCounts.monday), totalDays: dayCounts.monday.total, completedDays: dayCounts.monday.completed },
        tuesday: { completionRate: this.calculateRate(dayCounts.tuesday), totalDays: dayCounts.tuesday.total, completedDays: dayCounts.tuesday.completed },
        wednesday: { completionRate: this.calculateRate(dayCounts.wednesday), totalDays: dayCounts.wednesday.total, completedDays: dayCounts.wednesday.completed },
        thursday: { completionRate: this.calculateRate(dayCounts.thursday), totalDays: dayCounts.thursday.total, completedDays: dayCounts.thursday.completed },
        friday: { completionRate: this.calculateRate(dayCounts.friday), totalDays: dayCounts.friday.total, completedDays: dayCounts.friday.completed },
        saturday: { completionRate: this.calculateRate(dayCounts.saturday), totalDays: dayCounts.saturday.total, completedDays: dayCounts.saturday.completed },
        sunday: { completionRate: this.calculateRate(dayCounts.sunday), totalDays: dayCounts.sunday.total, completedDays: dayCounts.sunday.completed },
        peakDay: this.findPeakDay(dayCounts),
        consistencyScore: this.calculateConsistencyScore(dayCounts),
        trend: this.calculateTrend(habitHistory, habitType)
      };

      return patterns;
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
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      
      const habitHistory = await dailyHabitsService.getHabitHistory(userId, 'sleep', startDate, endDate);
      const reflectHistory = await dailyHabitsService.getHabitHistory(userId, 'reflect', startDate, endDate);
      
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
   * Calculate habit completion rates
   */
  async calculateHabitCompletionRate(userId: string, period: 'past7' | 'currentWeek' | 'last30' = 'past7'): Promise<HabitCompletionRate> {
    try {
      const timePeriod = TimePeriodUtils.getPeriodByType(period);
      const habitTypes = ['sleep', 'water', 'run', 'gym', 'reflect', 'cold_shower'];
      const habitBreakdown: any = {};
      let totalCompleted = 0;
      let totalPossible = 0;

      // Calculate completion for each habit type
      for (const habitType of habitTypes) {
        const history = await dailyHabitsService.getHabitHistory(userId, habitType, timePeriod.startDate, timePeriod.endDate);
        const completed = history.filter(record => this.isHabitCompleted(record, habitType)).length;
        const streak = await dailyHabitsService.getHabitStreak(userId, habitType);
        
        habitBreakdown[habitType] = {
          completion: history.length > 0 ? (completed / history.length) * 100 : 0,
          streak: streak.current_streak,
          goal: this.getHabitGoal(habitType)
        };

        totalCompleted += completed;
        totalPossible += history.length;
      }

      // Calculate total possible as days * habit types
      const allHistory = await dailyHabitsService.getDailyHabitsRange(userId, timePeriod.startDate, timePeriod.endDate);
      const uniqueDays = new Set(allHistory.map(record => record.date)).size;
      totalPossible = uniqueDays * habitTypes.length;

      console.log(`🔧 [Completion Rate Debug - ${period}]`, {
        period: timePeriod.label,
        startDate: timePeriod.startDate,
        endDate: timePeriod.endDate,
        allHistoryLength: allHistory.length,
        uniqueDays,
        habitTypesCount: habitTypes.length,
        totalPossible,
        totalCompleted,
        calculatedRate: totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0,
        uniqueDates: Array.from(new Set(allHistory.map(record => record.date)))
      });

      // Find top performing and needs attention habits
      const sortedHabits = Object.entries(habitBreakdown)
        .sort(([,a], [,b]) => b.completion - a.completion);
      
      const topPerforming = sortedHabits.slice(0, 2).map(([habit]) => habit);
      const needsAttention = sortedHabits.slice(-2).map(([habit]) => habit);

      return {
        overallCompletion: totalPossible > 0 ? (totalCompleted / totalPossible) * 100 : 0,
        habitBreakdown,
        topPerforming,
        needsAttention,
        weeklyGoal: totalPossible, // Use actual calculated total possible
        weeklyCompleted: totalCompleted,
        period: timePeriod
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
   * Generate weekly summary
   */
  async generateWeeklySummary(userId: string): Promise<WeeklySummary> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      const twoWeeksAgo = new Date(Date.now() - (14 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

      // Get current week data
      const currentWeekData = await dailyHabitsService.getDailyHabitsRange(userId, weekAgo, today);
      const previousWeekData = await dailyHabitsService.getDailyHabitsRange(userId, twoWeeksAgo, weekAgo);

      // Calculate current week stats
      const currentWeekCompleted = currentWeekData.filter(record => 
        this.isAnyHabitCompleted(record)
      ).length;
      
      const currentWeekTotal = currentWeekData.length * 6; // 6 habit types
      const currentWeekRate = currentWeekTotal > 0 ? (currentWeekCompleted / currentWeekTotal) * 100 : 0;

      // Calculate previous week stats
      const previousWeekCompleted = previousWeekData.filter(record => 
        this.isAnyHabitCompleted(record)
      ).length;
      
      const previousWeekTotal = previousWeekData.length * 6;
      const previousWeekRate = previousWeekTotal > 0 ? (previousWeekCompleted / previousWeekTotal) * 100 : 0;

      // Get streaks
      const habitTypes = ['sleep', 'water', 'run', 'gym', 'reflect', 'cold_shower'];
      const streaks = await Promise.all(
        habitTypes.map(habitType => dailyHabitsService.getHabitStreak(userId, habitType))
      );

      return {
        currentWeek: {
          totalHabits: currentWeekTotal,
          completedHabits: currentWeekCompleted,
          completionRate: currentWeekRate,
          streaks: streaks.filter(s => s.current_streak > 0)
        },
        previousWeek: {
          totalHabits: previousWeekTotal,
          completedHabits: previousWeekCompleted,
          completionRate: previousWeekRate
        },
        improvement: currentWeekRate - previousWeekRate,
        highlights: this.generateHighlights(currentWeekData, streaks),
        recommendations: this.generateRecommendations(currentWeekData, streaks)
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
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      
      const habitHistory = await dailyHabitsService.getHabitHistory(userId, habitType, startDate, endDate);
      
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
        // Check if sleep data exists (either calculated hours or bedtime/wake time)
        return (record.sleep_hours !== null && record.sleep_hours > 0) ||
               (record.sleep_bedtime_hours !== null && record.sleep_wakeup_hours !== null);
      case 'water':
        return record.water_intake !== null && record.water_intake > 0;
      case 'run':
        return record.run_day_type === 'active';
      case 'gym':
        return record.gym_day_type === 'active';
      case 'reflect':
        return record.reflect_mood !== null;
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
        rate: this.calculateRate(count)
      }));
      return rates.reduce((max, current) => current.rate > max.rate ? current : max).day;
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
   * Calculate cross-habit correlations
   */
  async calculateCrossHabitCorrelations(userId: string, days: number = 30): Promise<CrossHabitCorrelation> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      
      const habitHistory = await dailyHabitsService.getHabitHistory(userId, 'all', startDate, endDate);
      
      // Filter records with multiple data points
      const validRecords = habitHistory.filter(record => 
        (record.sleep_hours || record.sleep_quality) && 
        (record.reflect_mood || record.reflect_energy) &&
        record.date
      );

      if (validRecords.length < 5) {
        return this.getDefaultCrossHabitCorrelation();
      }

      // Calculate correlations
      const sleepToMood = this.calculateCorrelation(
        validRecords.map(r => r.sleep_quality || r.sleep_hours || 0),
        validRecords.map(r => r.reflect_mood || 0)
      );

      const sleepToEnergy = this.calculateCorrelation(
        validRecords.map(r => r.sleep_quality || r.sleep_hours || 0),
        validRecords.map(r => r.reflect_energy || 0)
      );

      const sleepToExercise = this.calculateCorrelation(
        validRecords.map(r => r.sleep_quality || r.sleep_hours || 0),
        validRecords.map(r => (r.run_distance || 0) + (r.gym_day_type === 'active' ? 1 : 0))
      );

      const waterToEnergy = this.calculateCorrelation(
        validRecords.map(r => r.water_intake || 0),
        validRecords.map(r => r.reflect_energy || 0)
      );

      const waterToMood = this.calculateCorrelation(
        validRecords.map(r => r.water_intake || 0),
        validRecords.map(r => r.reflect_mood || 0)
      );

      const exerciseToSleep = this.calculateCorrelation(
        validRecords.map(r => (r.run_distance || 0) + (r.gym_day_type === 'active' ? 1 : 0)),
        validRecords.map(r => r.sleep_quality || r.sleep_hours || 0)
      );

      const coldShowerToMood = this.calculateCorrelation(
        validRecords.map(r => r.cold_shower_completed ? 1 : 0),
        validRecords.map(r => r.reflect_mood || 0)
      );

      const coldShowerToEnergy = this.calculateCorrelation(
        validRecords.map(r => r.cold_shower_completed ? 1 : 0),
        validRecords.map(r => r.reflect_energy || 0)
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
        meditationToStress: 0, // Coming soon
        meditationToFocus: 0, // Coming soon
      };
    } catch (error) {
      console.error('Error calculating cross-habit correlations:', error);
      return this.getDefaultCrossHabitCorrelation();
    }
  }

  /**
   * Generate correlation insights
   */
  async generateCorrelationInsights(userId: string): Promise<CorrelationInsight[]> {
    try {
      const correlations = await this.calculateCrossHabitCorrelations(userId);
      const insights: CorrelationInsight[] = [];

      // Sleep to Mood correlation
      if (Math.abs(correlations.sleepToMood) > 0.3) {
        insights.push({
          type: correlations.sleepToMood > 0 ? 'positive' : 'negative',
          strength: Math.abs(correlations.sleepToMood) > 0.6 ? 'strong' : 'moderate',
          description: `Sleep quality ${correlations.sleepToMood > 0 ? 'positively' : 'negatively'} affects your mood`,
          recommendation: correlations.sleepToMood > 0 
            ? 'Focus on maintaining good sleep habits for better mood'
            : 'Consider adjusting your sleep routine to improve mood',
          dataPoints: 30
        });
      }

      // Water to Energy correlation
      if (Math.abs(correlations.waterToEnergy) > 0.3) {
        insights.push({
          type: correlations.waterToEnergy > 0 ? 'positive' : 'negative',
          strength: Math.abs(correlations.waterToEnergy) > 0.6 ? 'strong' : 'moderate',
          description: `Water intake ${correlations.waterToEnergy > 0 ? 'boosts' : 'reduces'} your energy levels`,
          recommendation: correlations.waterToEnergy > 0 
            ? 'Maintain consistent water intake throughout the day'
            : 'Monitor your water consumption patterns',
          dataPoints: 30
        });
      }

      // Exercise to Sleep correlation
      if (Math.abs(correlations.exerciseToSleep) > 0.3) {
        insights.push({
          type: correlations.exerciseToSleep > 0 ? 'positive' : 'negative',
          strength: Math.abs(correlations.exerciseToSleep) > 0.6 ? 'strong' : 'moderate',
          description: `Exercise ${correlations.exerciseToSleep > 0 ? 'improves' : 'affects'} your sleep quality`,
          recommendation: correlations.exerciseToSleep > 0 
            ? 'Regular exercise helps with better sleep'
            : 'Consider timing of exercise relative to bedtime',
          dataPoints: 30
        });
      }

      // Cold Shower to Mood correlation
      if (Math.abs(correlations.coldShowerToMood) > 0.3) {
        insights.push({
          type: correlations.coldShowerToMood > 0 ? 'positive' : 'negative',
          strength: Math.abs(correlations.coldShowerToMood) > 0.6 ? 'strong' : 'moderate',
          description: `Cold showers ${correlations.coldShowerToMood > 0 ? 'improve' : 'affect'} your mood`,
          recommendation: correlations.coldShowerToMood > 0 
            ? 'Cold showers may be beneficial for your mood'
            : 'Consider the timing of cold showers',
          dataPoints: 30
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating correlation insights:', error);
      return [];
    }
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
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
