import { supabase } from './supabase';

export interface MeditationSession {
  id: string;
  user_id: string;
  session_title: string;
  duration_minutes: number;
  completed_at: string;
  created_at: string;
}

export interface MeditationStats {
  totalSessions: number;
  averageSessionMinutes: number;
  totalTimeMinutes: number;
}

class MeditationService {
  /**
   * Record a completed meditation session
   */
  async recordSession(
    userId: string,
    sessionTitle: string,
    durationMinutes: number
  ): Promise<MeditationSession | null> {
    try {
      const { data, error } = await supabase
        .from('meditation_sessions')
        .insert({
          user_id: userId,
          session_title: sessionTitle,
          duration_minutes: durationMinutes,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording meditation session:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error recording meditation session:', error);
      return null;
    }
  }

  /**
   * Get meditation statistics for a user
   */
  async getStats(userId: string): Promise<MeditationStats> {
    try {
      const { data, error } = await supabase
        .from('meditation_sessions')
        .select('duration_minutes')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching meditation stats:', error);
        return {
          totalSessions: 0,
          averageSessionMinutes: 0,
          totalTimeMinutes: 0,
        };
      }

      if (!data || data.length === 0) {
        return {
          totalSessions: 0,
          averageSessionMinutes: 0,
          totalTimeMinutes: 0,
        };
      }

      const totalSessions = data.length;
      const totalTimeMinutes = data.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
      const averageSessionMinutes = totalTimeMinutes / totalSessions;

      return {
        totalSessions,
        averageSessionMinutes: Math.round(averageSessionMinutes),
        totalTimeMinutes,
      };
    } catch (error) {
      console.error('Error fetching meditation stats:', error);
      return {
        totalSessions: 0,
        averageSessionMinutes: 0,
        totalTimeMinutes: 0,
      };
    }
  }
}

export const meditationService = new MeditationService();
