import { analyticsService } from './analyticsService';
import { dailyHabitsService } from './dailyHabitsService';
import { dailyInsightsService } from './dailyInsightsService';
import TimePeriodUtils from './timePeriodUtils';
import { InsightCard } from '../types/insights';

type InsightPeriod = 'past7' | 'currentWeek' | 'last30';

class InsightService {
  private periodDays(period: InsightPeriod): number {
    const p = TimePeriodUtils.getPeriodByType(period);
    const today = TimePeriodUtils.toLocalDateString(new Date());
    const end = p.endDate > today ? today : p.endDate;
    return TimePeriodUtils.getDaysBetween(p.startDate, end);
  }

  /**
   * Generate today's overview with enhanced daily insights for specific period
   */
  async generateTodayOverview(userId: string, period: InsightPeriod = 'past7'): Promise<InsightCard> {
    try {
      const habitTypes = ['sleep', 'water', 'run', 'gym', 'reflect', 'cold_shower'];
      const streaks = await dailyHabitsService.getHabitStreaksBatch(userId, habitTypes);
      const dailyInsights = await dailyInsightsService.generateDailyInsights(userId, period);

      const activeStreaks = streaks.filter((streak) => streak.current_streak > 0);

      const topStreak = activeStreaks.reduce(
        (max, streak) => (streak.current_streak > max.current_streak ? streak : max),
        { current_streak: 0, habit_type: '', longest_streak: 0 }
      );

      const description = dailyInsights.summary;
      const icon = this.getMoodIcon(dailyInsights.mood);

      return {
        type: 'streak',
        title: "Today's Overview",
        description,
        icon,
        data: {
          streaks: activeStreaks,
          topStreak: topStreak.current_streak > 0 ? topStreak : null,
          dailyInsights: dailyInsights.insights,
          keyMetrics: dailyInsights.keyMetrics,
          mood: dailyInsights.mood,
          periodLabel: TimePeriodUtils.getPeriodByType(period).label,
        },
        priority: 90,
        expandable: true,
        expanded: false,
      };
    } catch (error) {
      return this.getDefaultTodayOverview();
    }
  }

  private getMoodIcon(mood: 'positive' | 'neutral' | 'concerned'): string {
    switch (mood) {
      case 'positive':
        return 'happy';
      case 'concerned':
        return 'alert-circle';
      default:
        return 'trending-up';
    }
  }

  /**
   * Generate weekly patterns insight for the selected period
   */
  async generateWeeklyPatterns(userId: string, period: InsightPeriod = 'past7'): Promise<InsightCard> {
    try {
      const days = Math.max(7, this.periodDays(period));
      const sleepPatterns = await analyticsService.calculateWeeklyPatterns(userId, 'sleep', days);
      const waterPatterns = await analyticsService.calculateWeeklyPatterns(userId, 'water', days);

      let description = '';
      let icon = 'bulb';

      if (sleepPatterns.peakDay && waterPatterns.peakDay) {
        description = `Your sleep quality peaks on ${this.capitalizeFirst(sleepPatterns.peakDay)}s. Water intake is best on ${this.capitalizeFirst(waterPatterns.peakDay)}s.`;
      } else if (sleepPatterns.peakDay) {
        description = `Your sleep quality peaks on ${this.capitalizeFirst(sleepPatterns.peakDay)}s.`;
      } else if (waterPatterns.peakDay) {
        description = `Your water intake peaks on ${this.capitalizeFirst(waterPatterns.peakDay)}s.`;
      } else {
        description = 'Complete more habits to see your weekly patterns.';
        icon = 'calendar';
      }

      const totalDays =
        sleepPatterns.monday.totalDays +
        sleepPatterns.tuesday.totalDays +
        sleepPatterns.wednesday.totalDays +
        sleepPatterns.thursday.totalDays +
        sleepPatterns.friday.totalDays +
        sleepPatterns.saturday.totalDays +
        sleepPatterns.sunday.totalDays;

      return {
        type: 'pattern',
        title: 'Weekly Pattern',
        description,
        icon,
        data: {
          sleepPatterns,
          waterPatterns,
          consistencyScore: Math.max(sleepPatterns.consistencyScore, waterPatterns.consistencyScore),
          totalDays,
          periodLabel: TimePeriodUtils.getPeriodByType(period).label,
        },
        priority: 80,
        expandable: true,
        expanded: false,
      };
    } catch (error) {
      return this.getDefaultWeeklyPatterns();
    }
  }

  /**
   * Generate correlation insights for the selected period
   */
  async generateCorrelationInsights(userId: string, period: InsightPeriod = 'past7'): Promise<InsightCard> {
    try {
      const days = this.periodDays(period);
      const correlationInsights = await analyticsService.generateCorrelationInsights(userId, days);

      if (correlationInsights.length === 0) {
        return {
          type: 'correlation',
          title: 'Habit Correlations',
          description: 'Complete more habits to discover how they affect each other.',
          icon: 'link',
          data: {
            correlations: [],
            message: 'Need more data to analyze correlations',
            periodLabel: TimePeriodUtils.getPeriodByType(period).label,
          },
          priority: 70,
          expandable: true,
          expanded: false,
        };
      }

      const strengthScore = (s: string) => (s === 'strong' ? 1 : s === 'moderate' ? 0.5 : 0.3);
      const strongestCorrelation = correlationInsights.reduce((strongest, insight) =>
        strengthScore(insight.strength) > strengthScore(strongest.strength) ? insight : strongest
      );

      return {
        type: 'correlation',
        title: 'Habit Correlations',
        description: strongestCorrelation.description,
        icon: 'link',
        data: {
          correlations: correlationInsights,
          strongestCorrelation,
          totalCorrelations: correlationInsights.length,
          periodLabel: TimePeriodUtils.getPeriodByType(period).label,
        },
        priority: 70,
        expandable: true,
        expanded: false,
      };
    } catch (error) {
      return this.getDefaultCorrelationInsights();
    }
  }

  /**
   * Generate recommendations insight for the selected period
   */
  async generateRecommendations(userId: string, period: InsightPeriod = 'past7'): Promise<InsightCard> {
    try {
      const completionRate = await analyticsService.calculateHabitCompletionRate(userId, period);
      const sleepCorrelations = await analyticsService.analyzeSleepCorrelations(
        userId,
        this.periodDays(period)
      );

      const recommendations: string[] = [];

      if (sleepCorrelations.sleepQualityMoodCorrelation < 0.6) {
        recommendations.push(
          'Your sleep quality affects your mood. Try going to bed 30 minutes earlier.'
        );
      }

      if (completionRate.overallCompletion < 70) {
        recommendations.push(
          'Try to complete at least 70% of your habits in this period for better consistency.'
        );
      }

      if (completionRate.needsAttention.length > 0) {
        const habit = completionRate.needsAttention[0].replace('_', ' ');
        recommendations.push(`Focus on improving your ${habit} habit consistency.`);
      }

      if (sleepCorrelations.bedtimeConsistency < 70) {
        recommendations.push('Try to maintain a consistent bedtime for better sleep quality.');
      }

      const description =
        recommendations.length > 0
          ? recommendations[0]
          : "You're doing great! Keep up the excellent work.";

      return {
        type: 'recommendation',
        title: 'Recommendations',
        description,
        icon: 'bulb',
        data: {
          recommendations,
          sleepCorrelation: sleepCorrelations.sleepQualityMoodCorrelation,
          completionRate: completionRate.overallCompletion,
          periodLabel: TimePeriodUtils.getPeriodByType(period).label,
        },
        priority: 70,
        expandable: true,
        expanded: false,
      };
    } catch (error) {
      return this.getDefaultRecommendations();
    }
  }

  /**
   * Generate basic insights (fast loading)
   */
  async generateBasicInsights(userId: string, period: InsightPeriod = 'past7'): Promise<InsightCard[]> {
    try {
      const timeoutPromise = (promise: Promise<any>, timeoutMs: number = 15000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Basic insights timeout after ${timeoutMs}ms`)), timeoutMs)
          ),
        ]);
      };

      const todayOverview = await timeoutPromise(this.generateTodayOverview(userId, period), 15000);
      return [todayOverview];
    } catch (error) {
      return [this.getDefaultTodayOverview()];
    }
  }

  /**
   * Generate all insights for a user with period support
   */
  async generateInsights(userId: string, period: InsightPeriod = 'past7'): Promise<InsightCard[]> {
    try {
      const insights = await Promise.all([
        this.generateTodayOverview(userId, period),
        this.generateWeeklyPatterns(userId, period),
        this.generateCorrelationInsights(userId, period),
        this.generateRecommendations(userId, period),
      ]);

      return insights.sort((a, b) => b.priority - a.priority).slice(0, 4);
    } catch (error) {
      return [
        this.getDefaultTodayOverview(),
        this.getDefaultWeeklyPatterns(),
        this.getDefaultCorrelationInsights(),
        this.getDefaultRecommendations(),
      ];
    }
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private getDefaultTodayOverview(): InsightCard {
    return {
      type: 'streak',
      title: "Today's Overview",
      description: 'Start tracking your habits to see insights!',
      icon: 'trending-up',
      data: { streaks: [], topStreak: null },
      priority: 90,
      expandable: true,
      expanded: false,
    };
  }

  private getDefaultWeeklyPatterns(): InsightCard {
    return {
      type: 'pattern',
      title: 'Weekly Pattern',
      description: 'Complete more habits to see your weekly patterns.',
      icon: 'calendar',
      data: { sleepPatterns: null, waterPatterns: null, consistencyScore: 0, totalDays: 0 },
      priority: 80,
      expandable: true,
      expanded: false,
    };
  }

  private getDefaultRecommendations(): InsightCard {
    return {
      type: 'recommendation',
      title: 'Recommendations',
      description: 'Complete your first habit to get personalized recommendations.',
      icon: 'bulb',
      data: { recommendations: [], sleepCorrelation: 0, completionRate: 0 },
      priority: 70,
      expandable: true,
      expanded: false,
    };
  }

  private getDefaultCorrelationInsights(): InsightCard {
    return {
      type: 'correlation',
      title: 'Habit Correlations',
      description: 'Complete more habits to discover how they affect each other.',
      icon: 'link',
      data: { correlations: [], message: 'Need more data to analyze correlations' },
      priority: 70,
      expandable: true,
      expanded: false,
    };
  }
}

export const insightService = new InsightService();
