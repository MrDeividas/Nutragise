import { dailyHabitsService } from './dailyHabitsService';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  habit_type: string;
  last_completion_date: string;
}

interface StreakAnalytics {
  activeStreaks: StreakData[];
  topStreak: StreakData | null;
  totalActiveStreaks: number;
  averageStreakLength: number;
}

class StreakService {
  /**
   * Get all active streaks for a user
   */
  async getActiveStreaks(userId: string): Promise<StreakData[]> {
    try {
      const habitTypes = ['sleep', 'water', 'run', 'gym', 'reflect', 'cold_shower'];
      const streaks = await Promise.all(
        habitTypes.map(habitType => dailyHabitsService.getHabitStreak(userId, habitType))
      );
      
      return streaks.filter(streak => streak.current_streak > 0);
    } catch (error) {
      console.error('Error getting active streaks:', error);
      return [];
    }
  }

  /**
   * Get the top performing streak
   */
  async getTopStreak(userId: string): Promise<StreakData | null> {
    try {
      const activeStreaks = await this.getActiveStreaks(userId);
      
      if (activeStreaks.length === 0) return null;
      
      return activeStreaks.reduce((max, streak) => 
        streak.current_streak > max.current_streak ? streak : max
      );
    } catch (error) {
      console.error('Error getting top streak:', error);
      return null;
    }
  }

  /**
   * Get comprehensive streak analytics
   */
  async getStreakAnalytics(userId: string): Promise<StreakAnalytics> {
    try {
      const activeStreaks = await this.getActiveStreaks(userId);
      const topStreak = await this.getTopStreak(userId);
      
      const averageStreakLength = activeStreaks.length > 0 
        ? activeStreaks.reduce((sum, streak) => sum + streak.current_streak, 0) / activeStreaks.length
        : 0;

      return {
        activeStreaks,
        topStreak,
        totalActiveStreaks: activeStreaks.length,
        averageStreakLength: Math.round(averageStreakLength * 10) / 10
      };
    } catch (error) {
      console.error('Error getting streak analytics:', error);
      return {
        activeStreaks: [],
        topStreak: null,
        totalActiveStreaks: 0,
        averageStreakLength: 0
      };
    }
  }

  /**
   * Get streak trend (improving, declining, stable)
   */
  async getStreakTrend(userId: string, habitType: string): Promise<'improving' | 'declining' | 'stable'> {
    try {
      const streak = await dailyHabitsService.getHabitStreak(userId, habitType);
      
      if (streak.current_streak === 0) return 'stable';
      
      // Simple trend calculation based on current vs longest streak
      const ratio = streak.current_streak / streak.longest_streak;
      
      if (ratio > 0.8) return 'improving';
      if (ratio < 0.3) return 'declining';
      return 'stable';
    } catch (error) {
      console.error('Error getting streak trend:', error);
      return 'stable';
    }
  }

  /**
   * Get streak recommendations
   */
  async getStreakRecommendations(userId: string): Promise<string[]> {
    try {
      const analytics = await this.getStreakAnalytics(userId);
      const recommendations: string[] = [];

      if (analytics.totalActiveStreaks === 0) {
        recommendations.push("Start building your first streak by completing a habit today!");
        return recommendations;
      }

      if (analytics.averageStreakLength < 3) {
        recommendations.push("Try to maintain streaks for at least 3 days to build momentum.");
      }

      if (analytics.totalActiveStreaks < 2) {
        recommendations.push("Add another habit to your routine to build multiple streaks.");
      }

      const topStreak = analytics.topStreak;
      if (topStreak && topStreak.current_streak > 7) {
        recommendations.push(`Great job on your ${topStreak.habit_type} streak! Keep it going.`);
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting streak recommendations:', error);
      return ["Focus on building consistent habits."];
    }
  }
}

export const streakService = new StreakService();
