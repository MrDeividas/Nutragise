import { analyticsService } from './analyticsService';
import { dailyHabitsService } from './dailyHabitsService';
import { DailyHabits } from '../types/database';
import { config, getApiKey, isApiKeyConfigured } from './config';
import { supabase } from './supabase';

interface AIResponse {
  response: string;
  suggestions?: string[];
  dataInsights?: any;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
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
  last7DaysWater: { date: string; glasses: number }[];
  last7DaysActivity: { date: string; gym: boolean; run: boolean; runDistance: number | null }[];
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

type ApiMessage = { role: 'system' | 'user' | 'assistant'; content: string };

class AIService {
  private baseUrl: string = config.deepseek.baseUrl;

  /**
   * Generate personalized AI response based on user data
   */
  async generateResponse(
    userId: string,
    userMessage: string,
    conversationHistory: ChatTurn[] = []
  ): Promise<AIResponse> {
    try {
      const context = await this.buildUserContext(userId);
      const systemPrompt = this.createSystemPrompt(context);
      const messages = this.buildMessages(systemPrompt, conversationHistory, userMessage);
      const response = await this.callDeepSeekAPI(messages);
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
      last7DaysWater: last7
        .filter(h => h.water_intake != null)
        .map(h => ({ date: h.date, glasses: h.water_intake! })),
      last7DaysActivity: last7
        .filter(h => h.gym_day_type === 'active' || h.run_day_type === 'active')
        .map(h => ({
          date: h.date,
          gym: h.gym_day_type === 'active',
          run: h.run_day_type === 'active',
          runDistance: h.run_distance ?? null,
        })),
    };
  }

  /**
   * System prompt: persona + strict DB-only rules + live user data
   */
  private createSystemPrompt(context: UserContext): string {
    const { stats, streaks, patterns, correlations, completionRate, displayName } = context;
    const completion = completionRate.overallCompletion || 0;
    const hasEnoughData = completion > 0;

    const fmt = (val: number | null, unit = '', fallback = 'not in database') =>
      val != null ? `${val}${unit}` : fallback;

    const sleepSection = stats.avgSleepHours != null
      ? `Sleep (30-day avg): ${fmt(stats.avgSleepHours, 'h')} per night, quality ${fmt(stats.avgSleepQuality, '/10')}
   Last 7 days: ${stats.last7DaysSleep.map(d => `${d.date}: ${d.hours}h (quality ${d.quality}/10)`).join(' | ') || 'none'}`
      : 'Sleep: not in database';

    const waterSection = stats.avgWaterIntake != null
      ? `Water (30-day avg): ${fmt(stats.avgWaterIntake, ' glasses/day')}
   Last 7 days: ${stats.last7DaysWater.map(d => `${d.date}: ${d.glasses} glasses`).join(' | ') || 'none'}`
      : 'Water: not in database';

    const exerciseSection = stats.totalGymSessions > 0 || stats.totalRunSessions > 0
      ? `Exercise (30 days): ${stats.totalGymSessions} gym sessions, ${stats.totalRunSessions} run/walk sessions${stats.totalRunDistance ? `, ${stats.totalRunDistance}km total distance` : ''}
   Last 7 days activity: ${stats.last7DaysActivity.map(d => `${d.date}: ${[d.gym ? 'gym' : null, d.run ? `run${d.runDistance != null ? ` ${d.runDistance}km` : ''}` : null].filter(Boolean).join('+')}`).join(' | ') || 'none'}`
      : 'Exercise: not in database';

    const wellbeingSection = stats.avgStress != null
      ? `Wellbeing (30-day avg): stress ${fmt(stats.avgStress, '/10')}, mood ${fmt(stats.avgMood, '/10')}, motivation ${fmt(stats.avgMotivation, '/10')}, energy ${fmt(stats.avgEnergy, '/10')}
   Last 7 days stress/motivation: ${stats.last7DaysStress.map(d => `${d.date}: stress ${d.stress}, motivation ${d.motivation}`).join(' | ') || 'none'}`
      : 'Wellbeing: not in database';

    const coldShowerSection = stats.coldShowerRate != null
      ? `Cold showers: ${stats.coldShowerRate}% completion rate`
      : 'Cold showers: not in database';

    const focusSection = stats.totalFocusMinutes != null
      ? `Focus sessions: ${stats.totalFocusMinutes} minutes total in 30 days`
      : 'Focus sessions: not in database';

    const reflectionSection = stats.recentReflections.length > 0
      ? `Recent reflections:\n${stats.recentReflections.map(r =>
          `   ${r.date}${r.wentWell ? ` — went well: "${r.wentWell}"` : ''}${r.friction ? ` — friction: "${r.friction}"` : ''}${r.tweak ? ` — tweak: "${r.tweak}"` : ''}`
        ).join('\n')}`
      : 'Reflections: not in database';

    const streakSection = streaks.length > 0
      ? `Active streaks: ${streaks.map(s => `${s.habit_type} ${s.current_streak} days`).join(', ')}`
      : 'Active streaks: none in database';

    const correlationSection = correlations.length > 0
      ? `Correlations found: ${correlations.slice(0, 3).map((c: any) => c.description || c.type).join('; ')}`
      : 'Correlations: none in database';

    return `You are Neutro, a data analyst for a habit-tracking app.${displayName ? ` The user's name is ${displayName}.` : ''}

SOURCE OF TRUTH:
- Answer ONLY using facts in USER_DATABASE below.
- Do not invent numbers, trends, causes, or personal details that are not listed.
- If the database has no data for the question, say clearly: "I don't have that in your tracked data yet" and suggest what to log. Do not fill the gap with generic coaching essays.
- General wellness tips are allowed only after stating what their database shows (or that it is missing), and must be brief (1 short sentence max).

ANTI-REPETITION:
- Never repeat the same sentence, paragraph, or advice twice in one reply.
- Do not restate earlier assistant messages. Answer the latest user question only.
- Do not pad replies with the same habit pitch every time.

STYLE:
- Conversational, specific, under 150 words.
- Prefer quoting their actual numbers and dates from USER_DATABASE.
- One clear answer; stop when done.

USER_DATABASE (last 30 days from app records):
${sleepSection}
${waterSection}
${exerciseSection}
${wellbeingSection}
${coldShowerSection}
${focusSection}
${reflectionSection}
${streakSection}
Weekly completion rate: ${hasEnoughData ? `${completion.toFixed(1)}%` : 'not in database'}
Best sleep day: ${patterns.sleep?.peakDay || 'not in database'}
Best water day: ${patterns.water?.peakDay || 'not in database'}
${correlationSection}`;
  }

  private buildMessages(
    systemPrompt: string,
    history: ChatTurn[],
    userMessage: string
  ): ApiMessage[] {
    const messages: ApiMessage[] = [{ role: 'system', content: systemPrompt }];

    // Prior turns only — current question is appended once as the final user message
    for (const turn of history.slice(-6)) {
      if (!turn.content?.trim()) continue;
      messages.push({
        role: turn.role === 'user' ? 'user' : 'assistant',
        content: turn.content.trim(),
      });
    }

    messages.push({ role: 'user', content: userMessage.trim() });
    return messages;
  }

  /**
   * Call DeepSeek API with proper multi-turn messages
   */
  private async callDeepSeekAPI(messages: ApiMessage[]): Promise<string> {
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
          messages,
          max_tokens: config.deepseek.maxTokens,
          temperature: config.deepseek.temperature,
          frequency_penalty: config.deepseek.frequencyPenalty,
          presence_penalty: config.deepseek.presencePenalty,
        })
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`API request failed: ${response.status}${body ? ` — ${body.slice(0, 200)}` : ''}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('DeepSeek API error:', error);
      throw error;
    }
  }

  /**
   * Collapse accidental repeated paragraphs/sentences from the model
   */
  private collapseRepetition(text: string): string {
    if (!text) return text;

    // Drop consecutive duplicate paragraphs
    const paragraphs = text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean);
    const uniqueParagraphs: string[] = [];
    for (const p of paragraphs) {
      const prev = uniqueParagraphs[uniqueParagraphs.length - 1];
      if (!prev || prev.toLowerCase() !== p.toLowerCase()) {
        uniqueParagraphs.push(p);
      }
    }

    let cleaned = uniqueParagraphs.join('\n\n');

    // Drop consecutive duplicate sentences
    const sentences = cleaned.split(/(?<=[.!?])\s+/);
    const uniqueSentences: string[] = [];
    for (const s of sentences) {
      const prev = uniqueSentences[uniqueSentences.length - 1];
      if (!prev || prev.toLowerCase().trim() !== s.toLowerCase().trim()) {
        uniqueSentences.push(s);
      }
    }

    return uniqueSentences.join(' ').replace(/[ \t]+\n/g, '\n').trim();
  }

  /**
   * Parse AI response and extract insights
   */
  private parseAIResponse(aiResponse: string): AIResponse {
    const cleaned = this.collapseRepetition(aiResponse);
    return {
      response: cleaned,
      suggestions: this.extractSuggestions(cleaned),
      dataInsights: this.extractDataInsights(cleaned)
    };
  }

  /**
   * Extract actionable suggestions from AI response
   */
  private extractSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    const lines = response.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('1.') || trimmed.startsWith('2.') || trimmed.startsWith('3.')) {
        suggestions.push(trimmed.replace(/^[•\-1-9\.\s]+/, '').trim());
      }
    });
    return suggestions.slice(0, 3);
  }

  /**
   * Extract data insights from AI response
   */
  private extractDataInsights(response: string): any {
    const insights: any = {};
    const percentageMatch = response.match(/(\d+(?:\.\d+)?)%/g);
    if (percentageMatch) {
      insights.percentages = percentageMatch;
    }
    const streakMatch = response.match(/(\d+)\s*days?/gi);
    if (streakMatch) {
      insights.streaks = streakMatch;
    }
    return insights;
  }

  /**
   * Fallback response when AI is unavailable — no invented personal stats
   */
  private getFallbackResponse(userMessage: string): AIResponse {
    if (!isApiKeyConfigured()) {
      return {
        response:
          "Neutro isn't connected yet — add your DeepSeek API key to .env (DEEPSEEK_API_KEY), then restart the app.",
        suggestions: [],
      };
    }

    return {
      response:
        "I couldn't reach the analysis service just now, so I won't guess from your data. Please try again in a moment.",
      suggestions: [
        'How did I sleep this week?',
        'What does my water intake look like?',
        "What's my weekly habit completion?",
      ],
    };
  }

  /**
   * Test AI connection
   */
  async testAIConnection(): Promise<boolean> {
    try {
      const response = await this.callDeepSeekAPI([
        { role: 'system', content: 'You are a wellness assistant.' },
        { role: 'user', content: "Respond with 'AI is working!' if you can read this." },
      ]);
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
      const { stats, streaks, correlations, completionRate } = context;
      const insights: string[] = [];

      if (streaks.length > 0) {
        const best = streaks.reduce((max, s) => s.current_streak > max.current_streak ? s : max);
        insights.push(`Your ${best.habit_type} streak is ${best.current_streak} days.`);
      }

      if (stats.avgSleepHours != null) {
        insights.push(
          stats.avgSleepHours < 7
            ? `You're averaging ${stats.avgSleepHours}h sleep — below the 7–9h range.`
            : `You're averaging ${stats.avgSleepHours}h sleep over the last 30 days.`
        );
      }

      if (stats.avgStress != null && stats.avgMotivation != null) {
        insights.push(`30-day avg: stress ${stats.avgStress}/10, motivation ${stats.avgMotivation}/10.`);
      }

      if (stats.totalGymSessions > 0 || stats.totalRunSessions > 0) {
        insights.push(`${stats.totalGymSessions} gym sessions and ${stats.totalRunSessions} runs logged in the last 30 days.`);
      }

      if (completionRate.overallCompletion > 0) {
        insights.push(`Weekly habit completion: ${completionRate.overallCompletion.toFixed(1)}%.`);
      }

      if (correlations.length > 0) {
        insights.push(`${correlations.length} habit connection${correlations.length === 1 ? '' : 's'} found in your data.`);
      }

      return insights.length > 0
        ? insights
        : [
            'No habit data in your database yet.',
            'Log sleep, water, or activity to unlock personalised insights.',
          ];
    } catch (error) {
      console.error('Error getting quick insights:', error);
      return [
        'Could not load your habit data right now.',
        'Try again after logging a habit.',
      ];
    }
  }
}

export const aiService = new AIService();
