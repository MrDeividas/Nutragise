import { analyticsService } from './analyticsService';
import { streakService } from './streakService';
import { patternService } from './patternService';

interface DailyInsight {
  type: 'achievement' | 'warning' | 'tip' | 'pattern' | 'correlation';
  title: string;
  message: string;
  priority: number;
  icon: string;
  actionable: boolean;
  actionText?: string;
}

interface DailyInsightsData {
  insights: DailyInsight[];
  summary: string;
  mood: 'positive' | 'neutral' | 'concerned';
  keyMetrics: {
    activeStreaks: number;
    weeklyConsistency: number;
    completionRate: number;
    topPerformer: string | null;
  };
}

class DailyInsightsService {
  /**
   * Generate daily insights for Today's Overview with period support
   */
  async generateDailyInsights(userId: string, period: 'past7' | 'currentWeek' | 'last30' = 'past7'): Promise<DailyInsightsData> {
    try {
      const [streaks, patterns, completionRate, correlations] = await Promise.all([
        streakService.getStreakAnalytics(userId),
        patternService.getPatternAnalytics(userId),
        analyticsService.calculateHabitCompletionRate(userId, period),
        analyticsService.generateCorrelationInsights(userId)
      ]);

      const insights: DailyInsight[] = [];
      let mood: 'positive' | 'neutral' | 'concerned' = 'neutral';

      // Achievement insights
      if (streaks.topStreak && streaks.topStreak.current_streak >= 7) {
        insights.push({
          type: 'achievement',
          title: 'Streak Champion!',
          message: `You've maintained a ${streaks.topStreak.current_streak}-day ${streaks.topStreak.habit_type} streak!`,
          priority: 90,
          icon: 'trophy',
          actionable: false
        });
        mood = 'positive';
      }

      // New streak achievements
      if (streaks.totalActiveStreaks > 0 && streaks.totalActiveStreaks <= 3) {
        insights.push({
          type: 'achievement',
          title: 'Building Momentum',
          message: `You have ${streaks.totalActiveStreaks} active streak${streaks.totalActiveStreaks > 1 ? 's' : ''}! Keep building your habit foundation.`,
          priority: 85,
          icon: 'trending-up',
          actionable: true,
          actionText: 'View streaks'
        });
        mood = 'positive';
      }

      // Consistency improvements
      if (patterns.overallConsistency > 0 && patterns.overallConsistency < 50) {
        insights.push({
          type: 'tip',
          title: 'Consistency Opportunity',
          message: `Your weekly consistency is ${Math.round(patterns.overallConsistency)}%. Small daily efforts lead to big improvements.`,
          priority: 80,
          icon: 'bulb',
          actionable: true,
          actionText: 'Get tips'
        });
      } else if (patterns.overallConsistency >= 70) {
        insights.push({
          type: 'achievement',
          title: 'Consistency Master',
          message: `Excellent ${Math.round(patterns.overallConsistency)}% weekly consistency! You're building lasting habits.`,
          priority: 85,
          icon: 'checkmark-circle',
          actionable: false
        });
        mood = 'positive';
      }

      // Warning insights
      if (completionRate.overallCompletion < 50) {
        insights.push({
          type: 'warning',
          title: 'Low Weekly Completion',
          message: `You've only completed ${Math.round(completionRate.overallCompletion)}% of your weekly habits.`,
          priority: 85,
          icon: 'warning',
          actionable: true,
          actionText: 'View recommendations'
        });
        mood = 'concerned';
      }

      // Pattern insights
      if (patterns.worstDay) {
        const worstDayName = patterns.worstDay.charAt(0).toUpperCase() + patterns.worstDay.slice(1);
        insights.push({
          type: 'pattern',
          title: 'Weekly Pattern Detected',
          message: `${worstDayName}s are your most challenging day for habit completion.`,
          priority: 80,
          icon: 'calendar',
          actionable: true,
          actionText: 'Get tips'
        });
      }

      // Correlation insights
      if (correlations.length > 0) {
        const strongestCorrelation = correlations[0];
        insights.push({
          type: 'correlation',
          title: 'Habit Connection Found',
          message: `Your ${strongestCorrelation.habit1} and ${strongestCorrelation.habit2} habits are strongly connected.`,
          priority: 75,
          icon: 'link',
          actionable: true,
          actionText: 'Learn more'
        });
      }

      // Tip insights
      if (streaks.totalActiveStreaks === 0) {
        insights.push({
          type: 'tip',
          title: 'Start Your Journey',
          message: 'Complete your first habit today to start building streaks!',
          priority: 70,
          icon: 'bulb',
          actionable: true,
          actionText: 'View habits'
        });
      } else if (streaks.averageStreakLength < 3) {
        insights.push({
          type: 'tip',
          title: 'Build Momentum',
          message: 'Try to maintain streaks for at least 3 days to build lasting habits.',
          priority: 65,
          icon: 'trending-up',
          actionable: true,
          actionText: 'Get advice'
        });
      }

      // Water intake insights
      const waterStreak = streaks.activeStreaks.find(s => s.habit_type === 'water');
      if (waterStreak && waterStreak.current_streak < 5) {
        insights.push({
          type: 'tip',
          title: 'Hydration Boost',
          message: `Your water streak is ${waterStreak.current_streak} days. Aim for 5+ days!`,
          priority: 55,
          icon: 'water',
          actionable: true,
          actionText: 'Hydration tips'
        });
      }

      // Exercise insights
      const exerciseStreaks = streaks.activeStreaks.filter(s => ['run', 'gym'].includes(s.habit_type));
      if (exerciseStreaks.length > 0) {
        const avgExerciseStreak = exerciseStreaks.reduce((sum, s) => sum + s.current_streak, 0) / exerciseStreaks.length;
        if (avgExerciseStreak >= 5) {
          insights.push({
            type: 'achievement',
            title: 'Exercise Warrior',
            message: `Great exercise consistency! Average ${Math.round(avgExerciseStreak)}-day streak.`,
            priority: 75,
            icon: 'fitness',
            actionable: false
          });
          mood = 'positive';
        } else if (avgExerciseStreak < 3) {
          insights.push({
            type: 'tip',
            title: 'Exercise Momentum',
            message: `Your exercise streak is ${Math.round(avgExerciseStreak)} days. Build momentum with daily movement.`,
            priority: 60,
            icon: 'fitness',
            actionable: true,
            actionText: 'Exercise tips'
          });
        }
      }

      // Sleep insights
      const sleepStreak = streaks.activeStreaks.find(s => s.habit_type === 'sleep');
      if (sleepStreak && sleepStreak.current_streak >= 5) {
        insights.push({
          type: 'achievement',
          title: 'Sleep Champion',
          message: `Excellent sleep routine! ${sleepStreak.current_streak}-day streak maintained.`,
          priority: 80,
          icon: 'moon',
          actionable: false
        });
        mood = 'positive';
      } else if (sleepStreak && sleepStreak.current_streak > 0 && sleepStreak.current_streak < 3) {
        insights.push({
          type: 'tip',
          title: 'Sleep Optimization',
          message: `Your sleep streak is ${sleepStreak.current_streak} days. Quality sleep is foundational.`,
          priority: 65,
          icon: 'moon',
          actionable: true,
          actionText: 'Sleep tips'
        });
      } else if (sleepStreak && sleepStreak.current_streak >= 3 && sleepStreak.current_streak < 5) {
        insights.push({
          type: 'tip',
          title: 'Sleep Optimization',
          message: `You've maintained good sleep for ${sleepStreak.current_streak} days. Keep it up!`,
          priority: 60,
          icon: 'moon',
          actionable: true,
          actionText: 'Optimize sleep'
        });
      }

      // Sort insights by priority and take top 3
      const topInsights = insights
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3);

      // Generate summary
      const summary = this.generateSummary(streaks, patterns, completionRate, mood);

      return {
        insights: topInsights,
        summary,
        mood,
        keyMetrics: {
          activeStreaks: streaks.totalActiveStreaks,
          weeklyConsistency: Math.round(patterns.overallConsistency),
          completionRate: Math.round(completionRate.overallCompletion),
          topPerformer: streaks.topStreak?.habit_type || null
        }
      };
    } catch (error) {
      console.error('Error generating daily insights:', error);
      return this.getDefaultDailyInsights();
    }
  }

  /**
   * Generate summary text based on user's data
   */
  private generateSummary(
    streaks: any, 
    patterns: any, 
    completionRate: any, 
    mood: 'positive' | 'neutral' | 'concerned'
  ): string {
    if (mood === 'positive') {
      return `Great progress! You have ${streaks.totalActiveStreaks} active streaks and ${Math.round(completionRate.overallCompletion)}% weekly completion. Keep up the excellent work!`;
    } else if (mood === 'concerned') {
      return `You have ${streaks.totalActiveStreaks} active streaks but your weekly completion is ${Math.round(completionRate.overallCompletion)}%. Focus on consistency this week.`;
    } else {
      return `You have ${streaks.totalActiveStreaks} active streaks with ${Math.round(completionRate.overallCompletion)}% weekly completion. Steady progress!`;
    }
  }

  /**
   * Get default insights when data is unavailable
   */
  private getDefaultDailyInsights(): DailyInsightsData {
    return {
      insights: [
        {
          type: 'tip',
          title: 'Welcome to Neutro!',
          message: 'Complete your first habit to start seeing personalized insights.',
          priority: 100,
          icon: 'bulb',
          actionable: true,
          actionText: 'Get started'
        }
      ],
      summary: 'Start tracking your habits to see personalized insights and recommendations.',
      mood: 'neutral',
      keyMetrics: {
        activeStreaks: 0,
        weeklyConsistency: 0,
        completionRate: 0,
        topPerformer: null
      }
    };
  }

  /**
   * Refresh daily insights when new habit data is added
   */
  async refreshDailyInsights(userId: string): Promise<DailyInsightsData> {
    // Force refresh by clearing any cached data and regenerating
    return this.generateDailyInsights(userId);
  }

  /**
   * Get daily insights for a specific date range
   */
  async getDailyInsightsForDateRange(userId: string, startDate: string, endDate: string): Promise<DailyInsightsData> {
    try {
      // This could be enhanced to show insights for specific date ranges
      // For now, return current daily insights
      return this.generateDailyInsights(userId);
    } catch (error) {
      console.error('Error getting daily insights for date range:', error);
      return this.getDefaultDailyInsights();
    }
  }

  /**
   * Get insights for specific habit type
   */
  async getHabitSpecificInsights(userId: string, habitType: string): Promise<DailyInsight[]> {
    try {
      const insights: DailyInsight[] = [];
      
      switch (habitType) {
        case 'sleep':
          const sleepPatterns = await patternService.getWeeklyPatterns(userId, 'sleep');
          if (sleepPatterns.peakDay) {
            insights.push({
              type: 'pattern',
              title: 'Sleep Pattern',
              message: `Your sleep quality peaks on ${sleepPatterns.peakDay}s.`,
              priority: 80,
              icon: 'moon',
              actionable: true,
              actionText: 'Optimize sleep'
            });
          }
          break;
          
        case 'water':
          insights.push({
            type: 'tip',
            title: 'Hydration Tip',
            message: 'Try setting hourly water reminders to build consistency.',
            priority: 75,
            icon: 'water',
            actionable: true,
            actionText: 'Set reminders'
          });
          break;
          
        case 'run':
        case 'gym':
          insights.push({
            type: 'tip',
            title: 'Exercise Optimization',
            message: 'Morning workouts often lead to better consistency and energy levels.',
            priority: 75,
            icon: 'fitness',
            actionable: true,
            actionText: 'Get tips'
          });
          break;
      }

      return insights;
    } catch (error) {
      console.error('Error getting habit-specific insights:', error);
      return [];
    }
  }
}

export const dailyInsightsService = new DailyInsightsService();
