import { analyticsService } from './analyticsService';
import { dailyHabitsService } from './dailyHabitsService';
import { DailyHabits } from '../types/database';
import { config, getApiKey } from './config';

interface AIResponse {
  response: string;
  suggestions?: string[];
  dataInsights?: any;
}

interface UserContext {
  userId: string;
  recentHabits: DailyHabits[];
  streaks: any[];
  patterns: any;
  correlations: any;
  completionRate: any;
}

class AIService {
  private baseUrl: string = config.deepseek.baseUrl;

  constructor() {
    // API key is managed by config
  }

  /**
   * Generate personalized AI response based on user data
   */
  async generateResponse(userId: string, userMessage: string): Promise<AIResponse> {
    try {
      // Gather user context
      const context = await this.buildUserContext(userId);
      
      // Create the prompt for the AI
      const prompt = this.createPrompt(context, userMessage);
      
      // Call DeepSeek API
      const response = await this.callDeepSeekAPI(prompt);
      
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('Error generating AI response:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Build comprehensive user context for AI analysis
   */
  private async buildUserContext(userId: string): Promise<UserContext> {
    try {
      // Get recent habits (last 30 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
      
      const recentHabits = await dailyHabitsService.getHabitHistory(userId, 'all', startDate, endDate);
      
      // Get current streaks
      const sleepStreak = await dailyHabitsService.getHabitStreak(userId, 'sleep');
      const waterStreak = await dailyHabitsService.getHabitStreak(userId, 'water');
      const runStreak = await dailyHabitsService.getHabitStreak(userId, 'run');
      const gymStreak = await dailyHabitsService.getHabitStreak(userId, 'gym');
      const reflectStreak = await dailyHabitsService.getHabitStreak(userId, 'reflect');
      const coldShowerStreak = await dailyHabitsService.getHabitStreak(userId, 'cold_shower');
      
      const streaks = [sleepStreak, waterStreak, runStreak, gymStreak, reflectStreak, coldShowerStreak].filter(Boolean);
      
      // Get patterns
      const sleepPatterns = await analyticsService.calculateWeeklyPatterns(userId, 'sleep', 4);
      const waterPatterns = await analyticsService.calculateWeeklyPatterns(userId, 'water', 4);
      
      // Get correlations
      const correlations = await analyticsService.generateCorrelationInsights(userId);
      
      // Get completion rate
      const completionRate = await analyticsService.calculateHabitCompletionRate(userId, 'week');
      
      return {
        userId,
        recentHabits,
        streaks,
        patterns: { sleep: sleepPatterns, water: waterPatterns },
        correlations,
        completionRate
      };
    } catch (error) {
      console.error('Error building user context:', error);
      throw error;
    }
  }

  /**
   * Create a comprehensive prompt for the AI
   */
  private createPrompt(context: UserContext, userMessage: string): string {
    const systemPrompt = `You are Neutro, an AI wellness assistant. You help users understand their health data, provide personalized insights, and offer actionable recommendations.

Your responses should be:
- Friendly and encouraging
- Data-driven and specific
- Actionable with clear next steps
- Under 200 words
- Focused on wellness and habit building

Current user data:
- Recent habits: ${context.recentHabits.length} records in the last 30 days
- Current streaks: ${context.streaks.map(s => `${s.habit_type}: ${s.current_streak} days`).join(', ')}
- Sleep pattern: Best on ${context.patterns.sleep.peakDay || 'insufficient data'}s
- Water pattern: Best on ${context.patterns.water.peakDay || 'insufficient data'}s
- Weekly completion rate: ${context.completionRate.overallCompletion?.toFixed(1) || 0}%
- Correlations found: ${context.correlations.length} significant relationships

User message: "${userMessage}"

Provide a helpful, personalized response based on their data.`;

    return systemPrompt;
  }

  /**
   * Call DeepSeek API
   */
  private async callDeepSeekAPI(prompt: string): Promise<string> {
    const apiKey = getApiKey();

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: config.deepseek.model,
          messages: [
            {
              role: 'system',
              content: prompt
            }
          ],
          max_tokens: config.deepseek.maxTokens,
          temperature: config.deepseek.temperature
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw error;
    }
  }

  /**
   * Parse AI response and extract insights
   */
  private parseAIResponse(aiResponse: string): AIResponse {
    return {
      response: aiResponse,
      suggestions: this.extractSuggestions(aiResponse),
      dataInsights: this.extractDataInsights(aiResponse)
    };
  }

  /**
   * Extract actionable suggestions from AI response
   */
  private extractSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    
    // Look for bullet points or numbered suggestions
    const lines = response.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('1.') || trimmed.startsWith('2.') || trimmed.startsWith('3.')) {
        suggestions.push(trimmed.replace(/^[•\-1-9\.\s]+/, '').trim());
      }
    });
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }

  /**
   * Extract data insights from AI response
   */
  private extractDataInsights(response: string): any {
    // Extract any mentioned numbers or metrics
    const insights: any = {};
    
    // Look for percentages
    const percentageMatch = response.match(/(\d+(?:\.\d+)?)%/g);
    if (percentageMatch) {
      insights.percentages = percentageMatch;
    }
    
    // Look for streak mentions
    const streakMatch = response.match(/(\d+)\s*days?/gi);
    if (streakMatch) {
      insights.streaks = streakMatch;
    }
    
    return insights;
  }

  /**
   * Fallback response when AI is unavailable
   */
  private getFallbackResponse(userMessage: string): AIResponse {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('sleep') || lowerMessage.includes('bed')) {
      return {
        response: "I can help you with sleep insights! Try tracking your sleep quality and bedtime consistently for a week to see your sleep patterns and get personalized recommendations.",
        suggestions: [
          "Track your sleep quality daily",
          "Set a consistent bedtime",
          "Monitor how sleep affects your mood"
        ]
      };
    }
    
    if (lowerMessage.includes('water') || lowerMessage.includes('hydrat')) {
      return {
        response: "Great question about hydration! I can analyze your water intake patterns and suggest optimal times to drink water based on your daily routine.",
        suggestions: [
          "Log your water intake daily",
          "Set hydration reminders",
          "Track how water affects your energy"
        ]
      };
    }
    
    if (lowerMessage.includes('exercise') || lowerMessage.includes('workout') || lowerMessage.includes('gym')) {
      return {
        response: "Exercise is key to wellness! I can help you understand your workout patterns, optimal training times, and how exercise affects your other habits.",
        suggestions: [
          "Log your workouts consistently",
          "Track your energy levels",
          "Monitor recovery patterns"
        ]
      };
    }
    
    return {
      response: "I'm here to help with your wellness journey! I can analyze your habit data, provide personalized insights, and suggest improvements. What specific aspect of your wellness would you like to explore?",
      suggestions: [
        "Ask about your sleep patterns",
        "Get hydration recommendations",
        "Explore habit correlations"
      ]
    };
  }

  /**
   * Test AI connection
   */
  async testAIConnection(): Promise<boolean> {
    try {
      const testPrompt = "You are a wellness assistant. Respond with 'AI is working!' if you can read this.";
      const response = await this.callDeepSeekAPI(testPrompt);
      return response.toLowerCase().includes('ai is working');
    } catch (error) {
      console.error('AI connection test failed:', error);
      return false;
    }
  }

  /**
   * Get quick insights without user input
   */
  async getQuickInsights(userId: string): Promise<string[]> {
    try {
      const context = await this.buildUserContext(userId);
      const insights: string[] = [];
      
      // Generate insights based on data
      if (context.streaks.length > 0) {
        const bestStreak = context.streaks.reduce((max, streak) => 
          streak.current_streak > max.current_streak ? streak : max
        );
        insights.push(`🔥 Your ${bestStreak.habit_type} streak is ${bestStreak.current_streak} days! Keep it up!`);
      }
      
      if (context.completionRate.overallCompletion > 70) {
        insights.push(`📈 You're completing ${context.completionRate.overallCompletion.toFixed(1)}% of your weekly habits - excellent consistency!`);
      } else if (context.completionRate.overallCompletion < 50) {
        insights.push(`💪 Try to complete at least 70% of your weekly habits for better results. You're currently at ${context.completionRate.overallCompletion.toFixed(1)}%.`);
      }
      
      if (context.patterns.sleep.peakDay) {
        insights.push(`😴 Your sleep quality peaks on ${context.patterns.sleep.peakDay.charAt(0).toUpperCase() + context.patterns.sleep.peakDay.slice(1)}s.`);
      }
      
      if (context.correlations.length > 0) {
        insights.push(`🔗 I found ${context.correlations.length} interesting connections between your habits!`);
      }
      
      return insights;
    } catch (error) {
      console.error('Error getting quick insights:', error);
      return [
        "Welcome to your wellness journey!",
        "Start tracking your habits to see personalized insights.",
        "I'm here to help you achieve your wellness goals!"
      ];
    }
  }
}

export const aiService = new AIService();
