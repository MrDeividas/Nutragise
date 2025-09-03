import { analyticsService } from './analyticsService';
import { streakService } from './streakService';
import { patternService } from './patternService';
import CacheService from './cacheService';

interface SuggestionContext {
  userId: string;
  recentHabits: any[];
  streaks: any[];
  patterns: any;
  correlations: any[];
  goals: any[];
  completionRate: number;
}

interface SmartSuggestion {
  text: string;
  priority: number;
  category: 'streak' | 'pattern' | 'goal' | 'correlation' | 'general';
  dataContext?: any;
}

class SmartSuggestionEngine {
  /**
   * Generate contextual suggestions based on user data
   */
  async generateSuggestions(userId: string): Promise<string[]> {
    try {
      const context = await this.buildContext(userId);
      const suggestions = await this.analyzeAndGenerate(context);
      
      // Return top 4 suggestions by priority
      const finalSuggestions = suggestions
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 4)
        .map(s => s.text);
      
      return finalSuggestions;
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return this.getFallbackSuggestions();
    }
  }

  /**
   * Build context for suggestion generation
   */
  private async buildContext(userId: string): Promise<SuggestionContext> {
    const [streaks, patterns, correlations, completionRate] = await Promise.all([
      streakService.getActiveStreaks(userId),
      patternService.getPatternAnalytics(userId),
      analyticsService.generateCorrelationInsights(userId),
      analyticsService.calculateHabitCompletionRate(userId, 'week')
    ]);

    return {
      userId,
      recentHabits: [], // Will be populated from daily habits
      streaks,
      patterns,
      correlations,
      goals: [], // Will be populated from goals
      completionRate: completionRate.overallCompletion
    };
  }

  /**
   * Analyze user data and generate contextual suggestions
   */
  private async analyzeAndGenerate(context: SuggestionContext): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];

        // Streak-based suggestions
    if (context.streaks.length === 0) {
      suggestions.push({
        text: "How can I start building my first habit streak?",
        priority: 90,
        category: 'streak'
      });
    } else {
      const weakestStreak = context.streaks.reduce((min, streak) => 
        streak.current_streak < min.current_streak ? streak : min
      );
      
      if (weakestStreak.current_streak < 3) {
        suggestions.push({
          text: `How can I improve my ${weakestStreak.habit_type} streak?`,
          priority: 85,
          category: 'streak',
          dataContext: weakestStreak
        });
      }
    }

    // Habit count suggestions - only suggest if we have some data
    if (context.patterns.habitCount === 0) {
      suggestions.push({
        text: "What habits should I start tracking first?",
        priority: 85,
        category: 'general'
      });
    } else if (context.patterns.habitCount < 3) {
      suggestions.push({
        text: "What additional habits would benefit my wellness routine?",
        priority: 75,
        category: 'general'
      });
    } else if (context.patterns.habitCount >= 5) {
      suggestions.push({
        text: "How can I balance all my different habits effectively?",
        priority: 70,
        category: 'general'
      });
    }

    // Pattern-based suggestions - only suggest if we have sufficient data
    if (context.patterns.habitCount === 0) {
      // No habits with data - suggest starting habits
      suggestions.push({
        text: "What should I know about building consistent habits?",
        priority: 85,
        category: 'pattern'
      });
    } else if (context.patterns.overallConsistency === 0) {
      // Insufficient data for consistency analysis - suggest building more data
      suggestions.push({
        text: "How long does it take to see consistency patterns in my habits?",
        priority: 80,
        category: 'pattern'
      });
    } else if (context.patterns.overallConsistency < 30) {
      suggestions.push({
        text: "Why is my weekly consistency so low?",
        priority: 80,
        category: 'pattern'
      });
    } else if (context.patterns.overallConsistency < 60) {
      suggestions.push({
        text: "How can I improve my weekly consistency?",
        priority: 75,
        category: 'pattern'
      });
    } else if (context.patterns.overallConsistency >= 80) {
      suggestions.push({
        text: "How can I maintain my high consistency momentum?",
        priority: 70,
        category: 'pattern'
      });
    }

    if (context.patterns.worstDay) {
      const worstDayName = context.patterns.worstDay.charAt(0).toUpperCase() + context.patterns.worstDay.slice(1);
      suggestions.push({
        text: `What's causing my ${worstDayName} slump?`,
        priority: 75,
        category: 'pattern',
        dataContext: { worstDay: context.patterns.worstDay }
      });
    }

    // Correlation-based suggestions
    if (context.correlations.length > 0) {
      const strongestCorrelation = context.correlations[0];
      suggestions.push({
        text: `How does ${strongestCorrelation.habit1} affect my ${strongestCorrelation.habit2}?`,
        priority: 70,
        category: 'correlation',
        dataContext: strongestCorrelation
      });
    }

    // Completion rate suggestions
    if (context.completionRate < 50) {
      suggestions.push({
        text: "How can I improve my weekly habit completion?",
        priority: 65,
        category: 'general'
      });
    } else if (context.completionRate >= 80) {
      suggestions.push({
        text: "How can I maintain my excellent completion rate?",
        priority: 60,
        category: 'general'
      });
    }

    // Sleep-specific suggestions
    const sleepStreak = context.streaks.find(s => s.habit_type === 'sleep');
    if (sleepStreak && sleepStreak.current_streak > 0) {
      suggestions.push({
        text: "How can I optimize my sleep routine?",
        priority: 60,
        category: 'streak',
        dataContext: sleepStreak
      });
    }

    // Water-specific suggestions
    const waterStreak = context.streaks.find(s => s.habit_type === 'water');
    if (waterStreak && waterStreak.current_streak < 5) {
      suggestions.push({
        text: "How can I improve my water drinking consistency?",
        priority: 55,
        category: 'streak',
        dataContext: waterStreak
      });
    }

    // Exercise-specific suggestions
    const exerciseStreaks = context.streaks.filter(s => ['run', 'gym'].includes(s.habit_type));
    if (exerciseStreaks.length > 0) {
      const avgExerciseStreak = exerciseStreaks.reduce((sum, s) => sum + s.current_streak, 0) / exerciseStreaks.length;
      if (avgExerciseStreak < 3) {
        suggestions.push({
          text: "How can I improve my exercise consistency?",
          priority: 50,
          category: 'streak'
        });
      }
    }

    // Fallback suggestions if not enough context-specific ones
    if (suggestions.length < 4) {
      suggestions.push(...this.getFallbackSuggestions().map(text => ({
        text,
        priority: 10,
        category: 'general' as const
      })));
    }

    return suggestions;
  }

  /**
   * Get fallback suggestions when context analysis fails
   */
  private getFallbackSuggestions(): string[] {
    return [
      "What habits can I improve?",
      "Summarise my week",
      "How can I balance my habits better?",
      "What's my biggest wellness opportunity?"
    ];
  }

  /**
   * Update suggestions when user completes new habits
   */
  async updateSuggestionsOnHabitCompletion(userId: string, habitType: string): Promise<string[]> {
    // Force refresh suggestions when user completes habits
    return this.generateSuggestions(userId);
  }

  /**
   * Get suggestions for specific habit type
   */
  async getHabitSpecificSuggestions(userId: string, habitType: string): Promise<string[]> {
    try {
      const streak = await streakService.getTopStreak(userId);
      const patterns = await patternService.getPatternAnalytics(userId);
      
      const suggestions: SmartSuggestion[] = [];

      switch (habitType) {
        case 'sleep':
          suggestions.push({
            text: "How can I improve my sleep quality?",
            priority: 90,
            category: 'streak'
          });
          if (patterns.sleepPatterns.peakDay) {
            suggestions.push({
              text: `Why do I sleep better on ${patterns.sleepPatterns.peakDay}s?`,
              priority: 85,
              category: 'pattern'
            });
          }
          break;
          
        case 'water':
          suggestions.push({
            text: "How can I improve my water drinking consistency?",
            priority: 90,
            category: 'streak'
          });
          break;
          
        case 'run':
        case 'gym':
          suggestions.push({
            text: "How can I improve my workout consistency?",
            priority: 90,
            category: 'streak'
          });
          break;
          
        default:
          suggestions.push({
            text: `How can I improve my ${habitType} habit?`,
            priority: 80,
            category: 'streak'
          });
      }

      return suggestions
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3)
        .map(s => s.text);
    } catch (error) {
      console.error('Error getting habit-specific suggestions:', error);
      return this.getFallbackSuggestions();
    }
  }
}

export const smartSuggestionEngine = new SmartSuggestionEngine();
