import { analyticsService } from './analyticsService';
import { dailyHabitsService } from './dailyHabitsService';
import { dailyInsightsService } from './dailyInsightsService';
import TimePeriodUtils from './timePeriodUtils';
import { InsightCard } from '../types/insights';

class InsightService {
  /**
   * Generate today's overview with enhanced daily insights for specific period
   */
  async generateTodayOverview(userId: string, period: 'past7' | 'currentWeek' | 'last30' = 'past7'): Promise<InsightCard> {
    try {
      const timePeriod = TimePeriodUtils.getPeriodByType(period);
      
      const [streaks, dailyInsights] = await Promise.all([
        Promise.all(['sleep', 'water', 'run', 'gym', 'reflect', 'cold_shower'].map(habitType => 
          dailyHabitsService.getHabitStreak(userId, habitType)
        )),
        dailyInsightsService.generateDailyInsights(userId, period)
      ]);

      const activeStreaks = streaks.filter(streak => streak.current_streak > 0);
      
      const topStreak = activeStreaks.reduce((max, streak) => 
        streak.current_streak > max.current_streak ? streak : max, 
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
          mood: dailyInsights.mood
        },
        priority: 90,
        expandable: true,
        expanded: false
      };
    } catch (error) {
      return this.getDefaultTodayOverview();
    }
  }

  /**
   * Get mood-based icon for today's overview
   */
  private getMoodIcon(mood: 'positive' | 'neutral' | 'concerned'): string {
    switch (mood) {
      case 'positive': return 'happy';
      case 'concerned': return 'alert-circle';
      default: return 'trending-up';
    }
  }

  /**
   * Generate weekly patterns insight
   */
  async generateWeeklyPatterns(userId: string): Promise<InsightCard> {
    try {
      // Get patterns for the most important habits
      const sleepPatterns = await analyticsService.calculateWeeklyPatterns(userId, 'sleep', 4);
      const waterPatterns = await analyticsService.calculateWeeklyPatterns(userId, 'water', 4);

      let description = '';
      let icon = "bulb";

      if (sleepPatterns.peakDay && waterPatterns.peakDay) {
        description = `Your water intake peaks on ${this.capitalizeFirst(sleepPatterns.peakDay)}s. Sleep quality is best on ${this.capitalizeFirst(waterPatterns.peakDay)}s.`;
      } else if (sleepPatterns.peakDay) {
        description = `Your sleep quality peaks on ${this.capitalizeFirst(sleepPatterns.peakDay)}s.`;
      } else if (waterPatterns.peakDay) {
        description = `Your water intake peaks on ${this.capitalizeFirst(waterPatterns.peakDay)}s.`;
      } else {
        description = "Complete more habits to see your weekly patterns.";
        icon = "calendar";
      }

      // Calculate total days from both patterns
      const totalDays = sleepPatterns.monday.totalDays + sleepPatterns.tuesday.totalDays + 
                       sleepPatterns.wednesday.totalDays + sleepPatterns.thursday.totalDays + 
                       sleepPatterns.friday.totalDays + sleepPatterns.saturday.totalDays + 
                       sleepPatterns.sunday.totalDays;

      return {
        type: 'pattern',
        title: "Weekly Pattern",
        description,
        icon,
        data: {
          sleepPatterns,
          waterPatterns,
          consistencyScore: Math.max(sleepPatterns.consistencyScore, waterPatterns.consistencyScore),
          totalDays
        },
        priority: 80,
        expandable: true,
        expanded: false
      };
    } catch (error) {
      return this.getDefaultWeeklyPatterns();
    }
  }

  /**
   * Generate correlation insights
   */
  async generateCorrelationInsights(userId: string): Promise<InsightCard> {
    try {
      const correlationInsights = await analyticsService.generateCorrelationInsights(userId);
      
      if (correlationInsights.length === 0) {
        return {
          type: 'correlation',
          title: "Habit Correlations",
          description: "Complete more habits to discover how they affect each other.",
          icon: "link",
          data: {
            correlations: [],
            message: "Need more data to analyze correlations"
          },
          priority: 70,
          expandable: true,
          expanded: false
        };
      }

      // Get the strongest correlation
      const strongestCorrelation = correlationInsights.reduce((strongest, insight) => 
        Math.abs(insight.strength === 'strong' ? 1 : insight.strength === 'moderate' ? 0.5 : 0.3) > 
        Math.abs(strongest.strength === 'strong' ? 1 : strongest.strength === 'moderate' ? 0.5 : 0.3) 
          ? insight : strongest
      );

      const description = strongestCorrelation.description;

      return {
        type: 'correlation',
        title: "Habit Correlations",
        description,
        icon: "link",
        data: {
          correlations: correlationInsights,
          strongestCorrelation,
          totalCorrelations: correlationInsights.length
        },
        priority: 70,
        expandable: true,
        expanded: false
      };
    } catch (error) {
      return this.getDefaultCorrelationInsights();
    }
  }

  /**
   * Generate recommendations insight
   */
  async generateRecommendations(userId: string): Promise<InsightCard> {
    try {
      const completionRate = await analyticsService.calculateHabitCompletionRate(userId, 'week');
      const sleepCorrelations = await analyticsService.analyzeSleepCorrelations(userId, 30);

      const recommendations: string[] = [];

      // Sleep quality recommendations
      if (sleepCorrelations.sleepQualityMoodCorrelation < 0.6) {
        recommendations.push("Your sleep quality affects your mood. Try going to bed 30 minutes earlier.");
      }

      // Consistency recommendations
      if (completionRate.overallCompletion < 70) {
        recommendations.push("Try to complete at least 70% of your weekly habits for better consistency.");
      }

      // Specific habit recommendations
      if (completionRate.needsAttention.length > 0) {
        const habit = completionRate.needsAttention[0];
        recommendations.push(`Focus on improving your ${habit} habit consistency.`);
      }

      // Bedtime consistency
      if (sleepCorrelations.bedtimeConsistency < 70) {
        recommendations.push("Try to maintain a consistent bedtime for better sleep quality.");
      }

      let description = '';
      if (recommendations.length > 0) {
        description = recommendations[0]; // Show the first recommendation
      } else {
        description = "You're doing great! Keep up the excellent work.";
      }

      return {
        type: 'recommendation',
        title: "Recommendations",
        description,
        icon: "bulb",
        data: {
          recommendations,
          sleepCorrelation: sleepCorrelations.sleepQualityMoodCorrelation,
          completionRate: completionRate.overallCompletion
        },
        priority: 70,
        expandable: true,
        expanded: false
      };
    } catch (error) {
      return this.getDefaultRecommendations();
    }
  }

  /**
   * Generate basic insights (fast loading)
   */
  async generateBasicInsights(userId: string): Promise<InsightCard[]> {
    try {
      // Add timeout wrapper for basic insights
      const timeoutPromise = (promise: Promise<any>, timeoutMs: number = 15000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Basic insights timeout after ${timeoutMs}ms`)), timeoutMs)
          )
        ]);
      };

      
      // Only load essential insights for immediate display
      const todayOverview = await timeoutPromise(this.generateTodayOverview(userId), 15000);
      
      
      return [todayOverview];
    } catch (error) {
      
      return [this.getDefaultTodayOverview()];
    }
  }

  /**
   * Generate all insights for a user with period support (only affects Today's Overview)
   */
  async generateInsights(userId: string, period: 'past7' | 'currentWeek' | 'last30' = 'past7'): Promise<InsightCard[]> {
    try {
      const insights = await Promise.all([
        this.generateTodayOverview(userId, period), // Only this uses the period
        this.generateWeeklyPatterns(userId),
        this.generateCorrelationInsights(userId),
        this.generateRecommendations(userId)
      ]);

      // Sort by priority and return top insights
      return insights
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 4);
    } catch (error) {
      return [
        this.getDefaultTodayOverview(),
        this.getDefaultWeeklyPatterns(),
        this.getDefaultCorrelationInsights(),
        this.getDefaultRecommendations()
      ];
    }
  }

  /**
   * Calculate insight priority based on data quality and relevance
   */
  private calculatePriority(insight: InsightCard, dataQuality: number): number {
    let priority = insight.priority;
    
    // Boost priority for high-quality data
    if (dataQuality > 0.8) priority += 10;
    else if (dataQuality < 0.3) priority -= 20;
    
    return Math.max(0, Math.min(100, priority));
  }

  /**
   * Capitalize first letter of string
   */
  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Default insight methods for error handling
  private getDefaultTodayOverview(): InsightCard {
    return {
      type: 'streak',
      title: "Today's Overview",
      description: "Start tracking your habits to see insights!",
      icon: "trending-up",
      data: { streaks: [], topStreak: null },
      priority: 90,
      expandable: true,
      expanded: false
    };
  }

  private getDefaultWeeklyPatterns(): InsightCard {
    return {
      type: 'pattern',
      title: "Weekly Pattern",
      description: "Complete more habits to see your weekly patterns.",
      icon: "calendar",
      data: { sleepPatterns: null, waterPatterns: null, consistencyScore: 0 },
      priority: 80,
      expandable: true,
      expanded: false
    };
  }

  private getDefaultRecommendations(): InsightCard {
    return {
      type: 'recommendation',
      title: "Recommendations",
      description: "Complete your first habit to get personalized recommendations.",
      icon: "bulb",
      data: { recommendations: [], sleepCorrelation: 0, completionRate: 0 },
      priority: 70,
      expandable: true,
      expanded: false
    };
  }

  private getDefaultCorrelationInsights(): InsightCard {
    return {
      type: 'correlation',
      title: "Habit Correlations",
      description: "Complete more habits to discover how they affect each other.",
      icon: "link",
      data: { correlations: [], message: "Need more data to analyze correlations" },
      priority: 70,
      expandable: true,
      expanded: false
    };
  }
}

export const insightService = new InsightService();
