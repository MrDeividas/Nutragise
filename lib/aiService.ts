import { analyticsService } from './analyticsService';
import { dailyHabitsService } from './dailyHabitsService';
import { DailyHabits } from '../types/database';
import { config, getApiKey } from './config';
import { supabase } from './supabase';

interface AIResponse {
  response: string;
  suggestions?: string[];
  dataInsights?: any;
}

interface HabitStats {
  avgSleepHours: number | null;
  avgSleepQuality: number | null;
  avgWaterIntake: number | null;
  avgStress: number | null;
  avgMood: number | null;
  avgMotivation: number | null;
  avgEnergy: number | null;
  totalRunSessions: number;
  totalRunDistance: number | null;
  totalGymSessions: number;
  coldShowerRate: number | null;
  totalFocusMinutes: number | null;
  recentReflections: { date: string; wentWell?: string; friction?: string; tweak?: string }[];
  last7DaysSleep: { date: string; hours: number; quality: number }[];
  last7DaysStress: { date: string; stress: number; motivation: number }[];
}

interface UserContext {
  userId: string;
  displayName: string | null;
  recentHabits: DailyHabits[];
  streaks: any[];
  patterns: any;
  correlations: any;
  completionRate: any;
  stats: HabitStats;
}

class AIService {
  private baseUrl: string = config.deepseek.baseUrl;

  /**
   * Generate personalized AI response based on user data
   */
  async generateResponse(userId: string, userMessage: string, conversationContext?: string): Promise<AIResponse> {
    try {
      const context = await this.buildUserContext(userId);
      const prompt = this.createPrompt(context, userMessage, conversationContext);
      const response = await this.callDeepSeekAPI(prompt);
      return this.parseAIResponse(response);
    } catch (error) {
      console.error('Error generating AI response:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * Build comprehensive user context including real habit values
   */
  private async buildUserContext(userId: string): Promise<UserContext> {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const week7Ago = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [
      recentHabits,
      sleepStreak, waterStreak, runStreak, gymStreak, reflectStreak, coldShowerStreak,
      sleepPatterns, waterPatterns,
      correlations,
      completionRate,
      profileResult,
    ] = await Promise.allSettled([
      dailyHabitsService.getHabitHistory(userId, 'all', startDate, endDate),
      dailyHabitsService.getHabitStreak(userId, 'sleep'),
      dailyHabitsService.getHabitStreak(userId, 'water'),
      dailyHabitsService.getHabitStreak(userId, 'run'),
      dailyHabitsService.getHabitStreak(userId, 'gym'),
      dailyHabitsService.getHabitStreak(userId, 'reflect'),
      dailyHabitsService.getHabitStreak(userId, 'cold_shower'),
      analyticsService.calculateWeeklyPatterns(userId, 'sleep', 4),
      analyticsService.calculateWeeklyPatterns(userId, 'water', 4),
      analyticsService.generateCorrelationInsights(userId),
      analyticsService.calculateHabitCompletionRate(userId, 'past7'),
      supabase.from('profiles').select('display_name, username').eq('id', userId).single(),
    ]);

    const habits: DailyHabits[] = recentHabits.status === 'fulfilled' ? recentHabits.value : [];
    const streaks = [sleepStreak, waterStreak, runStreak, gymStreak, reflectStreak, coldShowerStreak]
      .filter(r => r.status === 'fulfilled' && r.value?.current_streak > 0)
      .map(r => (r as PromiseFulfilledResult<any>).value);

    const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
    const displayName = profile?.display_name || profile?.username || null;

    const stats = this.computeStats(habits, week7Ago);

    return {
      userId,
      displayName,
      recentHabits: habits,
      streaks,
      patterns: {
        sleep: sleepPatterns.status === 'fulfilled' ? sleepPatterns.value : {},
        water: waterPatterns.status === 'fulfilled' ? waterPatterns.value : {},
      },
      correlations: correlations.status === 'fulfilled' ? correlations.value : [],
      completionRate: completionRate.status === 'fulfilled' ? completionRate.value : {},
      stats,
    };
  }

  /**
   * Compute averages and recent trends from raw habit records
   */
  private computeStats(habits: DailyHabits[], week7Ago: string): HabitStats {
    const avg = (vals: (number | undefined | null)[]): number | null => {
      const valid = vals.filter((v): v is number => v != null && !isNaN(v));
      return valid.length > 0 ? Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10 : null;
    };

    const sleepRecords = habits.filter(h => h.sleep_hours != null);
    const waterRecords = habits.filter(h => h.water_intake != null);
    const reflectRecords = habits.filter(h => h.reflect_stress != null || h.reflect_mood != null);
    const runRecords = habits.filter(h => h.run_day_type === 'active');
    const gymRecords = habits.filter(h => h.gym_day_type === 'active');
    const coldShowerRecords = habits.filter(h => h.cold_shower_completed != null);
    const focusRecords = habits.filter(h => h.focus_completed === true && h.focus_duration != null);

    const last7 = habits.filter(h => h.date >= week7Ago);

    return {
      avgSleepHours: avg(sleepRecords.map(h => h.sleep_hours)),
      avgSleepQuality: avg(sleepRecords.map(h => h.sleep_quality)),
      avgWaterIntake: avg(waterRecords.map(h => h.water_intake)),
      avgStress: avg(reflectRecords.map(h => h.reflect_stress)),
      avgMood: avg(reflectRecords.map(h => h.reflect_mood)),
      avgMotivation: avg(reflectRecords.map(h => h.reflect_motivation)),
      avgEnergy: avg(reflectRecords.map(h => h.reflect_energy)),
      totalRunSessions: runRecords.length,
      totalRunDistance: avg(runRecords.map(h => h.run_distance)) !== null
        ? runRecords.reduce((s, h) => s + (h.run_distance || 0), 0)
        : null,
      totalGymSessions: gymRecords.length,
      coldShowerRate: coldShowerRecords.length > 0
        ? Math.round((coldShowerRecords.filter(h => h.cold_shower_completed).length / coldShowerRecords.length) * 100)
        : null,
      totalFocusMinutes: focusRecords.length > 0
        ? focusRecords.reduce((s, h) => s + (h.focus_duration || 0), 0)
        : null,
      recentReflections: reflectRecords
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3)
        .filter(h => h.reflect_what_went_well || h.reflect_friction || h.reflect_one_tweak)
        .map(h => ({
          date: h.date,
          wentWell: h.reflect_what_went_well,
          friction: h.reflect_friction,
          tweak: h.reflect_one_tweak,
        })),
      last7DaysSleep: last7
        .filter(h => h.sleep_hours != null)
        .map(h => ({ date: h.date, hours: h.sleep_hours!, quality: h.sleep_quality || 0 })),
      last7DaysStress: last7
        .filter(h => h.reflect_stress != null || h.reflect_motivation != null)
        .map(h => ({ date: h.date, stress: h.reflect_stress || 0, motivation: h.reflect_motivation || 0 })),
    };
  }

  /**
   * Build a rich, data-specific prompt for the AI
   */
  private createPrompt(context: UserContext, userMessage: string, conversationContext?: string): string {
    const { stats, streaks, patterns, correlations, completionRate, displayName } = context;
    const completion = completionRate.overallCompletion || 0;
    const hasEnoughData = completion > 0;

    const fmt = (val: number | null, unit = '', fallback = 'no data') =>
      val != null ? `${val}${unit}` : fallback;

    const sleepSection = stats.avgSleepHours != null
      ? `Sleep (30-day avg): ${fmt(stats.avgSleepHours, 'h')} per night, quality ${fmt(stats.avgSleepQuality, '/10')}
   Last 7 days: ${stats.last7DaysSleep.map(d => `${d.date}: ${d.hours}h (quality ${d.quality}/10)`).join(' | ') || 'no data'}`
      : 'Sleep: not tracked yet';

    const waterSection = stats.avgWaterIntake != null
      ? `Water (30-day avg): ${fmt(stats.avgWaterIntake, ' glasses/day')}`
      : 'Water: not tracked yet';

    const exerciseSection = `Exercise (30 days): ${stats.totalGymSessions} gym sessions, ${stats.totalRunSessions} run/walk sessions${stats.totalRunDistance ? `, ${stats.totalRunDistance}km total distance` : ''}`;

    const wellbeingSection = stats.avgStress != null
      ? `Wellbeing (30-day avg): stress ${fmt(stats.avgStress, '/10')}, mood ${fmt(stats.avgMood, '/10')}, motivation ${fmt(stats.avgMotivation, '/10')}, energy ${fmt(stats.avgEnergy, '/10')}
   Last 7 days stress/motivation: ${stats.last7DaysStress.map(d => `${d.date}: stress ${d.stress}, motivation ${d.motivation}`).join(' | ') || 'no data'}`
      : 'Wellbeing: not tracked yet';

    const coldShowerSection = stats.coldShowerRate != null
      ? `Cold showers: ${stats.coldShowerRate}% completion rate`
      : 'Cold showers: not tracked yet';

    const focusSection = stats.totalFocusMinutes != null
      ? `Focus sessions: ${stats.totalFocusMinutes} minutes total in 30 days`
      : 'Focus sessions: not tracked yet';

    const reflectionSection = stats.recentReflections.length > 0
      ? `Recent reflections:\n${stats.recentReflections.map(r =>
          `   ${r.date}${r.wentWell ? ` — went well: "${r.wentWell}"` : ''}${r.friction ? ` — friction: "${r.friction}"` : ''}${r.tweak ? ` — tweak: "${r.tweak}"` : ''}`
        ).join('\n')}`
      : 'Reflections: none yet';

    const streakSection = streaks.length > 0
      ? `Active streaks: ${streaks.map(s => `${s.habit_type} ${s.current_streak} days`).join(', ')}`
      : 'No active streaks';

    const correlationSection = correlations.length > 0
      ? `Correlations found: ${correlations.length} (e.g. ${correlations.slice(0, 2).map((c: any) => c.description || c.type).join(', ')})`
      : 'Correlations: insufficient data';

    const conversationSection = conversationContext
      ? `\nRecent conversation:\n${conversationContext}\n`
      : '';

    return `You are Neutro, an AI wellness coach inside a habit-tracking app. You have access to the user's real health data below.${displayName ? ` The user's name is ${displayName}.` : ''}

RULES:
- Only reference data points that are actually present. Never invent numbers.
- Be specific — use the actual values (e.g. "your average sleep is 6.2h" not "you track sleep").
- Be conversational, warm, and under 200 words.
- If data is missing for something the user asks about, say so and suggest they start tracking it.
- Promote building ALL core habits (sleep, water, exercise, meditation, reflection, cold showers) systematically, one at a time.

USER'S REAL DATA (last 30 days):
${sleepSection}
${waterSection}
${exerciseSection}
${wellbeingSection}
${coldShowerSection}
${focusSection}
${reflectionSection}
${streakSection}
Weekly completion rate: ${hasEnoughData ? `${completion.toFixed(1)}%` : 'insufficient data'}
Best sleep day: ${patterns.sleep?.peakDay || 'insufficient data'}
Best water day: ${patterns.water?.peakDay || 'insufficient data'}
${correlationSection}
${conversationSection}
User message: "${userMessage}"

Respond with specific, data-driven advice using the actual numbers above.`;
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
      response: "I'm here to help with your complete wellness journey! I can analyze your habit data and guide you to systematically build ALL core wellness habits (sleep, water, exercise, meditation, reflection, cold showers) one by one. What's your first habit you'd like to focus on?",
      suggestions: [
        "How do I start with sleep optimization?",
        "What's the best way to build a water habit?",
        "How can I systematically add all core habits?"
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
      const { stats, streaks, patterns, correlations, completionRate } = context;
      const insights: string[] = [];

      if (streaks.length > 0) {
        const best = streaks.reduce((max, s) => s.current_streak > max.current_streak ? s : max);
        insights.push(`🔥 Your ${best.habit_type} streak is ${best.current_streak} days! Keep it up!`);
      }

      if (stats.avgSleepHours != null) {
        if (stats.avgSleepHours < 7) {
          insights.push(`😴 You're averaging ${stats.avgSleepHours}h sleep — below the 7-9h recommended range. Try moving bedtime 30 min earlier.`);
        } else {
          insights.push(`😴 Great sleep discipline — you're averaging ${stats.avgSleepHours}h over the last 30 days.`);
        }
      }

      if (stats.avgStress != null && stats.avgMotivation != null) {
        insights.push(`🧠 Your 30-day avg: stress ${stats.avgStress}/10, motivation ${stats.avgMotivation}/10.`);
      }

      if (stats.totalGymSessions > 0 || stats.totalRunSessions > 0) {
        insights.push(`💪 ${stats.totalGymSessions} gym sessions and ${stats.totalRunSessions} runs logged in the last 30 days.`);
      }

      if (completionRate.overallCompletion > 0) {
        const rate = completionRate.overallCompletion.toFixed(1);
        insights.push(completionRate.overallCompletion >= 70
          ? `📈 You're completing ${rate}% of weekly habits — excellent consistency!`
          : `💪 Weekly completion at ${rate}% — aim for 70%+ for best results.`
        );
      }

      if (correlations.length > 0) {
        insights.push(`🔗 I found ${correlations.length} interesting connections between your habits!`);
      }

      return insights.length > 0 ? insights : [
        "Welcome to your complete wellness journey!",
        "Start tracking your first core habit to unlock personalised insights.",
        "I'll guide you to build ALL core habits one by one!",
      ];
    } catch (error) {
      console.error('Error getting quick insights:', error);
      return [
        "Welcome to your complete wellness journey!",
        "Start with your first core habit, then systematically add the rest.",
        "I'll guide you to build ALL core habits one by one!",
      ];
    }
  }
}

export const aiService = new AIService();
