import { supabase } from './supabase';
import { DailyHabits, CreateDailyHabitsData, UpdateDailyHabitsData, HabitStreak } from '../types/database';

class DailyHabitsService {
  /**
   * Upsert daily habits data (insert or update)
   */
  async upsertDailyHabits(userId: string, date: string, habitData: CreateDailyHabitsData): Promise<DailyHabits | null> {
    try {
      console.log('upsertDailyHabits called with:', { userId, date, habitData });
      
      const { data, error } = await supabase.rpc('upsert_daily_habits', {
        p_user_id: userId,
        p_date: date,
        p_sleep_hours: habitData.sleep_hours,
        p_sleep_quality: habitData.sleep_quality,
        p_sleep_notes: habitData.sleep_notes,
        p_sleep_bedtime_hours: habitData.sleep_bedtime_hours,
        p_sleep_bedtime_minutes: habitData.sleep_bedtime_minutes,
        p_sleep_wakeup_hours: habitData.sleep_wakeup_hours,
        p_sleep_wakeup_minutes: habitData.sleep_wakeup_minutes,        p_water_intake: habitData.water_intake,
        p_water_goal: habitData.water_goal,
        p_water_notes: habitData.water_notes,
        p_run_day_type: habitData.run_day_type,
        p_run_type: habitData.run_type,
        p_run_distance: habitData.run_distance,
        p_run_duration: habitData.run_duration,
        p_run_notes: habitData.run_notes,
        p_gym_day_type: habitData.gym_day_type,
        p_gym_training_types: habitData.gym_training_types,
        p_gym_custom_type: habitData.gym_custom_type,
        p_reflect_mood: habitData.reflect_mood,
        p_reflect_energy: habitData.reflect_energy,
        p_reflect_what_went_well: habitData.reflect_what_went_well,
        p_reflect_friction: habitData.reflect_friction,
        p_reflect_one_tweak: habitData.reflect_one_tweak,
        p_reflect_nothing_to_change: habitData.reflect_nothing_to_change,
        p_cold_shower_completed: habitData.cold_shower_completed
      });

      if (error) {
        console.error('Error upserting daily habits:', error);
        throw error;
      }

      console.log('upsertDailyHabits successful, returned:', data);
      return data;
    } catch (error) {
      console.error('Error in upsertDailyHabits:', error);
      return null;
    }
  }

  /**
   * Clear a single habit for a user and date
   */
  async clearHabit(userId: string, date: string, habitType: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('clear_daily_habit', {
        p_user_id: userId,
        p_date: date,
        p_habit_type: habitType,
      });
      if (error) {
        console.error('Error clearing daily habit:', error);
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Error in clearHabit:', error);
      return false;
    }
  }

  /**
   * Get daily habits for a specific date
   */
  async getDailyHabits(userId: string, date: string): Promise<DailyHabits | null> {
    try {
      const { data, error } = await supabase
        .from('daily_habits')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching daily habits:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getDailyHabits:', error);
      return null;
    }
  }

  /**
   * Get daily habits for a date range
   */
  async getDailyHabitsRange(userId: string, startDate: string, endDate: string): Promise<DailyHabits[]> {
    try {
      const { data, error } = await supabase
        .from('daily_habits')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching daily habits range:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getDailyHabitsRange:', error);
      return [];
    }
  }

  /**
   * Get habit history for a specific habit type
   */
  async getHabitHistory(userId: string, habitType: string, startDate: string, endDate: string): Promise<DailyHabits[]> {
    try {
      let query = supabase
        .from('daily_habits')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      // Filter by habit type
      switch (habitType) {
        case 'sleep':
          query = query.not('sleep_hours', 'is', null);
          break;
        case 'water':
          query = query.not('water_intake', 'is', null);
          break;
        case 'run':
          query = query.not('run_day_type', 'is', null);
          break;
        case 'gym':
          query = query.not('gym_day_type', 'is', null);
          break;
        case 'reflect':
          query = query.not('reflect_mood', 'is', null);
          break;
        case 'cold_shower':
          query = query.not('cold_shower_completed', 'is', null);
          break;
        default:
          break;
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching habit history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getHabitHistory:', error);
      return [];
    }
  }

  /**
   * Calculate streak from a list of dates
   */
  private calculateStreak(dates: string[], today: string): { currentStreak: number; longestStreak: number } {
    if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    // Sort dates in descending order (most recent first)
    const sortedDates = [...dates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    for (const dateStr of sortedDates) {
      const recordDate = new Date(dateStr);
      
      if (lastDate === null) {
        // First record
        tempStreak = 1;
        lastDate = recordDate;
      } else {
        const dayDiff = Math.floor((lastDate.getTime() - recordDate.getTime()) / (24 * 60 * 60 * 1000));
        
        if (dayDiff === 1) {
          // Consecutive day
          tempStreak++;
        } else {
          // Break in streak
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 1;
        }
        lastDate = recordDate;
      }
    }

    // Check if we have a current streak
    const todayRecord = dates.find(d => d === today);
    if (todayRecord) {
      currentStreak = tempStreak;
    }

    // Update longest streak if current streak is longer
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }

    return { currentStreak, longestStreak };
  }

  /**
   * Get current streak for a specific habit
   */
  async getHabitStreak(userId: string, habitType: string): Promise<HabitStreak> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const history = await this.getHabitHistory(userId, habitType, thirtyDaysAgo, today);
      
      if (history.length === 0) {
        return {
          habit_type: habitType,
          current_streak: 0,
          longest_streak: 0
        };
      }

      // Sort by date descending
      const sortedHistory = history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let lastDate: Date | null = null;

      for (const record of sortedHistory) {
        const recordDate = new Date(record.date);
        
        if (lastDate === null) {
          // First record
          tempStreak = 1;
          lastDate = recordDate;
        } else {
          const dayDiff = Math.floor((lastDate.getTime() - recordDate.getTime()) / (24 * 60 * 60 * 1000));
          
          if (dayDiff === 1) {
            // Consecutive day
            tempStreak++;
          } else {
            // Break in streak
            if (tempStreak > longestStreak) {
              longestStreak = tempStreak;
            }
            tempStreak = 1;
          }
          lastDate = recordDate;
        }
      }

      // Check if we have a current streak
      const todayRecord = history.find(h => h.date === today);
      const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const yesterdayRecord = history.find(h => h.date === yesterdayDate);
      
      if (todayRecord) {
        // If completed today, current streak is the full temp streak
        currentStreak = tempStreak;
      } else if (yesterdayRecord && tempStreak > 0) {
        // If not completed today but yesterday was completed, current streak continues
        // (but is pending today's completion)
        currentStreak = tempStreak;
      } else {
        // No recent completion, streak is broken
        currentStreak = 0;
      }

      // Update longest streak if current streak is longer
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }

      return {
        habit_type: habitType,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_completed_date: sortedHistory[0]?.date
      };
    } catch (error) {
      console.error('Error in getHabitStreak:', error);
      return {
        habit_type: habitType,
        current_streak: 0,
        longest_streak: 0
      };
    }
  }

  /**
   * Delete daily habits for a specific date
   */
  async deleteDailyHabits(userId: string, date: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('daily_habits')
        .delete()
        .eq('user_id', userId)
        .eq('date', date);

      if (error) {
        console.error('Error deleting daily habits:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteDailyHabits:', error);
      return false;
    }
  }

  /**
   * Test function to verify database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('daily_habits')
        .select('count')
        .limit(1);

      if (error) {
        console.error('Database connection test failed:', error);
        return false;
      }

      console.log('Database connection test successful');
      return true;
    } catch (error) {
      console.error('Database connection test error:', error);
      return false;
    }
  }

  /**
   * Record a login day for the user
   */
  async recordLoginDay(userId: string, date: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_login_days')
        .upsert(
          { user_id: userId, login_date: date },
          { onConflict: 'user_id,login_date' }
        );
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error recording login day:', error);
      return false;
    }
  }

  /**
   * Get login streak for the user
   */
  async getLoginStreak(userId: string): Promise<HabitStreak> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('user_login_days')
        .select('login_date')
        .eq('user_id', userId)
        .gte('login_date', thirtyDaysAgo)
        .lte('login_date', today)
        .order('login_date', { ascending: false });
      
      if (error) throw error;
      
      const dates = data?.map(row => row.login_date) || [];
      const { currentStreak, longestStreak } = this.calculateStreak(dates, today);
      
      return {
        habit_type: 'login',
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_completed_date: dates[0] || undefined
      };
    } catch (error) {
      console.error('Error getting login streak:', error);
      return {
        habit_type: 'login',
        current_streak: 0,
        longest_streak: 0,
        last_completed_date: undefined
      };
    }
  }
}

export const dailyHabitsService = new DailyHabitsService(); 