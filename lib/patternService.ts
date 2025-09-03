import { analyticsService } from './analyticsService';

interface PatternData {
  peakDay: string | null;
  consistencyScore: number;
  totalDays: number;
  weeklyDistribution: {
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
    sunday: number;
  };
}

interface PatternAnalytics {
  sleepPatterns: PatternData;
  waterPatterns: PatternData;
  runPatterns: PatternData;
  gymPatterns: PatternData;
  reflectPatterns: PatternData;
  coldShowerPatterns: PatternData;
  overallConsistency: number;
  bestDay: string | null;
  worstDay: string | null;
  weeklyTrend: 'improving' | 'declining' | 'stable';
  habitCount: number;
}

class PatternService {
  /**
   * Get weekly patterns for a specific habit
   */
  async getWeeklyPatterns(userId: string, habitType: string, weeks: number = 4): Promise<PatternData> {
    try {
      const patterns = await analyticsService.calculateWeeklyPatterns(userId, habitType, weeks);
      
      return {
        peakDay: patterns.peakDay,
        consistencyScore: patterns.consistencyScore,
        totalDays: patterns.monday.totalDays + patterns.tuesday.totalDays + 
                  patterns.wednesday.totalDays + patterns.thursday.totalDays + 
                  patterns.friday.totalDays + patterns.saturday.totalDays + 
                  patterns.sunday.totalDays,
        weeklyDistribution: {
          monday: patterns.monday.totalDays,
          tuesday: patterns.tuesday.totalDays,
          wednesday: patterns.wednesday.totalDays,
          thursday: patterns.thursday.totalDays,
          friday: patterns.friday.totalDays,
          saturday: patterns.saturday.totalDays,
          sunday: patterns.sunday.totalDays
        }
      };
    } catch (error) {
      console.error('Error getting weekly patterns:', error);
      return {
        peakDay: null,
        consistencyScore: 0,
        totalDays: 0,
        weeklyDistribution: {
          monday: 0, tuesday: 0, wednesday: 0, thursday: 0,
          friday: 0, saturday: 0, sunday: 0
        }
      };
    }
  }

  /**
   * Get comprehensive pattern analytics
   */
  async getPatternAnalytics(userId: string): Promise<PatternAnalytics> {
    try {
      const [sleepPatterns, waterPatterns, runPatterns, gymPatterns, reflectPatterns, coldShowerPatterns] = await Promise.all([
        this.getWeeklyPatterns(userId, 'sleep', 4),
        this.getWeeklyPatterns(userId, 'water', 4),
        this.getWeeklyPatterns(userId, 'run', 4),
        this.getWeeklyPatterns(userId, 'gym', 4),
        this.getWeeklyPatterns(userId, 'reflect', 4),
        this.getWeeklyPatterns(userId, 'cold_shower', 4)
      ]);

      // Calculate overall consistency from ALL habits
      const allConsistencyScores = [
        sleepPatterns.consistencyScore,
        waterPatterns.consistencyScore,
        runPatterns.consistencyScore,
        gymPatterns.consistencyScore,
        reflectPatterns.consistencyScore,
        coldShowerPatterns.consistencyScore
      ].filter(score => score > 0); // Only include habits with data

      const overallConsistency = allConsistencyScores.length > 0 
        ? allConsistencyScores.reduce((sum, score) => sum + score, 0) / allConsistencyScores.length
        : 0;
      
      // Find best and worst days from ALL habits
      const allDays = [
        { 
          day: 'monday', 
          count: sleepPatterns.weeklyDistribution.monday + waterPatterns.weeklyDistribution.monday + 
                 runPatterns.weeklyDistribution.monday + gymPatterns.weeklyDistribution.monday + 
                 reflectPatterns.weeklyDistribution.monday + coldShowerPatterns.weeklyDistribution.monday
        },
        { 
          day: 'tuesday', 
          count: sleepPatterns.weeklyDistribution.tuesday + waterPatterns.weeklyDistribution.tuesday + 
                 runPatterns.weeklyDistribution.tuesday + gymPatterns.weeklyDistribution.tuesday + 
                 reflectPatterns.weeklyDistribution.tuesday + coldShowerPatterns.weeklyDistribution.tuesday
        },
        { 
          day: 'wednesday', 
          count: sleepPatterns.weeklyDistribution.wednesday + waterPatterns.weeklyDistribution.wednesday + 
                 runPatterns.weeklyDistribution.wednesday + gymPatterns.weeklyDistribution.wednesday + 
                 reflectPatterns.weeklyDistribution.wednesday + coldShowerPatterns.weeklyDistribution.wednesday
        },
        { 
          day: 'thursday', 
          count: sleepPatterns.weeklyDistribution.thursday + waterPatterns.weeklyDistribution.thursday + 
                 runPatterns.weeklyDistribution.thursday + gymPatterns.weeklyDistribution.thursday + 
                 reflectPatterns.weeklyDistribution.thursday + coldShowerPatterns.weeklyDistribution.thursday
        },
        { 
          day: 'friday', 
          count: sleepPatterns.weeklyDistribution.friday + waterPatterns.weeklyDistribution.friday + 
                 runPatterns.weeklyDistribution.friday + gymPatterns.weeklyDistribution.friday + 
                 reflectPatterns.weeklyDistribution.friday + coldShowerPatterns.weeklyDistribution.friday
        },
        { 
          day: 'saturday', 
          count: sleepPatterns.weeklyDistribution.saturday + waterPatterns.weeklyDistribution.saturday + 
                 runPatterns.weeklyDistribution.saturday + gymPatterns.weeklyDistribution.saturday + 
                 reflectPatterns.weeklyDistribution.saturday + coldShowerPatterns.weeklyDistribution.saturday
        },
        { 
          day: 'sunday', 
          count: sleepPatterns.weeklyDistribution.sunday + waterPatterns.weeklyDistribution.sunday + 
                 runPatterns.weeklyDistribution.sunday + gymPatterns.weeklyDistribution.sunday + 
                 reflectPatterns.weeklyDistribution.sunday + coldShowerPatterns.weeklyDistribution.sunday
        }
      ];

      const bestDay = allDays.reduce((max, day) => day.count > max.count ? day : max);
      const worstDay = allDays.reduce((min, day) => day.count < min.count ? day : min);

      // Determine weekly trend from all habits
      const weeklyTrend = this.calculateWeeklyTrendFromAllHabits([
        sleepPatterns, waterPatterns, runPatterns, gymPatterns, reflectPatterns, coldShowerPatterns
      ]);

      return {
        sleepPatterns,
        waterPatterns,
        runPatterns,
        gymPatterns,
        reflectPatterns,
        coldShowerPatterns,
        overallConsistency,
        bestDay: bestDay.count > 0 ? bestDay.day : null,
        worstDay: worstDay.count > 0 ? worstDay.day : null,
        weeklyTrend,
        habitCount: allConsistencyScores.length
      };
    } catch (error) {
      console.error('Error getting pattern analytics:', error);
      return {
        sleepPatterns: {
          peakDay: null,
          consistencyScore: 0,
          totalDays: 0,
          weeklyDistribution: { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 }
        },
        waterPatterns: {
          peakDay: null,
          consistencyScore: 0,
          totalDays: 0,
          weeklyDistribution: { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 }
        },
        runPatterns: {
          peakDay: null,
          consistencyScore: 0,
          totalDays: 0,
          weeklyDistribution: { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 }
        },
        gymPatterns: {
          peakDay: null,
          consistencyScore: 0,
          totalDays: 0,
          weeklyDistribution: { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 }
        },
        reflectPatterns: {
          peakDay: null,
          consistencyScore: 0,
          totalDays: 0,
          weeklyDistribution: { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 }
        },
        coldShowerPatterns: {
          peakDay: null,
          consistencyScore: 0,
          totalDays: 0,
          weeklyDistribution: { monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0 }
        },
        overallConsistency: 0,
        bestDay: null,
        worstDay: null,
        weeklyTrend: 'stable',
        habitCount: 0
      };
    }
  }

  /**
   * Calculate weekly trend from all habits
   */
  private calculateWeeklyTrendFromAllHabits(allPatterns: PatternData[]): 'improving' | 'declining' | 'stable' {
    const totalDays = allPatterns.reduce((sum, pattern) => sum + pattern.totalDays, 0);
    const avgConsistency = allPatterns.reduce((sum, pattern) => sum + pattern.consistencyScore, 0) / allPatterns.length;

    if (totalDays < 7) return 'stable';
    
    if (avgConsistency > 70) return 'improving';
    if (avgConsistency < 30) return 'declining';
    return 'stable';
  }

  /**
   * Calculate weekly trend based on pattern data
   */
  private calculateWeeklyTrend(sleepPatterns: PatternData, waterPatterns: PatternData): 'improving' | 'declining' | 'stable' {
    const totalDays = sleepPatterns.totalDays + waterPatterns.totalDays;
    const avgConsistency = (sleepPatterns.consistencyScore + waterPatterns.consistencyScore) / 2;

    if (totalDays < 7) return 'stable';
    
    if (avgConsistency > 70) return 'improving';
    if (avgConsistency < 30) return 'declining';
    return 'stable';
  }

  /**
   * Get pattern recommendations
   */
  async getPatternRecommendations(userId: string): Promise<string[]> {
    try {
      const analytics = await this.getPatternAnalytics(userId);
      const recommendations: string[] = [];

      if (analytics.overallConsistency < 50) {
        recommendations.push("Try to complete habits more consistently throughout the week.");
      }

      if (analytics.worstDay && analytics.bestDay) {
        const worstDayName = analytics.worstDay.charAt(0).toUpperCase() + analytics.worstDay.slice(1);
        recommendations.push(`Focus on improving your ${worstDayName} routine.`);
      }

      if (analytics.sleepPatterns.peakDay) {
        recommendations.push(`Your sleep quality peaks on ${analytics.sleepPatterns.peakDay}s. Try to maintain this pattern.`);
      }

      if (analytics.weeklyTrend === 'declining') {
        recommendations.push("Your weekly consistency is declining. Try to get back on track.");
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting pattern recommendations:', error);
      return ["Focus on building consistent weekly patterns."];
    }
  }

  /**
   * Get optimal time recommendations
   */
  async getOptimalTimeRecommendations(userId: string): Promise<string[]> {
    try {
      const optimalTimes = await analyticsService.analyzeOptimalTimes(userId, 30);
      const recommendations: string[] = [];

      if (optimalTimes.sleep?.optimalBedtime) {
        recommendations.push(`Try going to bed around ${optimalTimes.sleep.optimalBedtime} for better sleep quality.`);
      }

      if (optimalTimes.exercise?.optimalTime) {
        recommendations.push(`Your exercise performance peaks at ${optimalTimes.exercise.optimalTime}.`);
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting optimal time recommendations:', error);
      return [];
    }
  }
}

export const patternService = new PatternService();
