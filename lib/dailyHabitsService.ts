import { supabase } from './supabase';
import { apiCache } from './apiCache';
import { DailyHabits, CreateDailyHabitsData, UpdateDailyHabitsData, HabitStreak } from '../types/database';
import { DEFAULT_HABITS } from '../components/DailyHabitsSummary';
import { pillarProgressService } from './pillarProgressService';
import { notificationService } from './notificationService';

class DailyHabitsService {
  /**
   * Upsert daily habits data (insert or update)
   */
  async upsertDailyHabits(userId: string, date: string, habitData: CreateDailyHabitsData): Promise<DailyHabits | null> {
    try {
      // Try direct upsert first so we can write all fields (including newer ones like focus_*).
      const directPayload = this.buildDirectUpsertPayload(userId, date, habitData);
      const { data: directData, error: directError } = await supabase
        .from('daily_habits')
        .upsert(directPayload, { onConflict: 'user_id,date', returning: 'representation' })
        .select()
        .single();

      let result: DailyHabits | null = directData;

      if (directError) {
        console.warn('Direct daily_habits upsert failed, falling back to RPC:', directError);
        const rpcParams = this.buildRpcParams(userId, date, habitData);
        const { data: rpcData, error: rpcError } = await supabase.rpc('upsert_daily_habits', rpcParams);

        if (rpcError) {
          console.error('Error upserting daily habits via RPC:', rpcError);
          throw rpcError;
        }

        result = rpcData;
      }

      if (!result) {
        throw new Error('Failed to save daily habits');
      }

      const today = new Date().toISOString().split('T')[0];
      console.log('🔍 Pillar tracking check:', { 
        hasData: !!result, 
        date, 
        today, 
        isToday: date === today,
        gymDayType: habitData.gym_day_type 
      });
      
      // Track pillar progress for completed habits (only for today's date)
      if (result && date === today) {
        console.log('✅ Pillar tracking condition met, initializing pillars...');
        
        // Initialize pillars first if they don't exist (non-blocking)
        pillarProgressService.initializeUserPillars(userId).catch(err => {
          console.warn('Failed to initialize user pillars:', err);
        });
        
        // Strength & Fitness: gym, run, cold_shower, water
        if (habitData.gym_day_type === 'active') {
          console.log('💪 Gym habit detected, tracking action...');
          try {
            await pillarProgressService.trackAction(userId, 'strength_fitness', 'gym');
            console.log('✅ Gym pillar action tracked successfully');
          } catch (err) {
            console.error('❌ Failed to track gym action for pillar progress:', err);
          }
          notificationService.createHabitRewardNotification({
            user_id: userId,
            habit_type: 'gym',
            points_gained: 15,
            pillar_type: 'strength_fitness',
            pillar_progress: 0.36
          }).catch(console.error);
        } else {
          console.log('⚠️ Gym habit not active:', habitData.gym_day_type);
        }
        if (habitData.run_activity_type || habitData.run_day_type === 'active') {
          console.log('🏃 Run habit detected, tracking action...');
          try {
            await pillarProgressService.trackAction(userId, 'strength_fitness', 'run');
            console.log('✅ Run pillar action tracked successfully');
          } catch (err) {
            console.error('❌ Failed to track run action for pillar progress:', err);
          }
          notificationService.createHabitRewardNotification({
            user_id: userId,
            habit_type: 'run',
            points_gained: 15,
            pillar_type: 'strength_fitness',
            pillar_progress: 0.36
          }).catch(console.error);
        }
        if (habitData.cold_shower_completed) {
          try {
            await pillarProgressService.trackAction(userId, 'strength_fitness', 'cold_shower');
          } catch (err) {
            console.error('❌ Failed to track cold_shower action for pillar progress:', err);
          }
          notificationService.createHabitRewardNotification({
            user_id: userId,
            habit_type: 'cold_shower',
            points_gained: 15,
            pillar_type: 'strength_fitness',
            pillar_progress: 0.36
          }).catch(console.error);
        }
        if (habitData.water_intake && habitData.water_intake > 0) {
          try {
            await pillarProgressService.trackAction(userId, 'strength_fitness', 'water');
          } catch (err) {
            console.error('❌ Failed to track water action for pillar progress:', err);
          }
          notificationService.createHabitRewardNotification({
            user_id: userId,
            habit_type: 'water',
            points_gained: 15,
            pillar_type: 'strength_fitness',
            pillar_progress: 0.36
          }).catch(console.error);
        }
        
        // Growth & Wisdom: reflect, focus
        if (habitData.reflect_mood || habitData.reflect_energy) {
          try {
            await pillarProgressService.trackAction(userId, 'growth_wisdom', 'reflect');
          } catch (err) {
            console.error('❌ Failed to track reflect action for pillar progress:', err);
          }
          notificationService.createHabitRewardNotification({
            user_id: userId,
            habit_type: 'reflect',
            points_gained: 15,
            pillar_type: 'growth_wisdom',
            pillar_progress: 0.36
          }).catch(console.error);
        }
        if (habitData.focus_completed) {
          try {
            await pillarProgressService.trackAction(userId, 'growth_wisdom', 'focus');
          } catch (err) {
            console.error('❌ Failed to track focus action for pillar progress:', err);
          }
          notificationService.createHabitRewardNotification({
            user_id: userId,
            habit_type: 'focus',
            points_gained: 15,
            pillar_type: 'growth_wisdom',
            pillar_progress: 0.36
          }).catch(console.error);
        }
        
        // Discipline: sleep
        if (habitData.sleep_hours && habitData.sleep_hours > 0) {
          try {
            await pillarProgressService.trackAction(userId, 'discipline', 'sleep');
          } catch (err) {
            console.error('❌ Failed to track sleep action for pillar progress:', err);
          }
          notificationService.createHabitRewardNotification({
            user_id: userId,
            habit_type: 'sleep',
            points_gained: 15,
            pillar_type: 'discipline',
            pillar_progress: 0.36
          }).catch(console.error);
        }
      }
      
      // Invalidate habit streak cache when habits are completed
      const habitTypes = ['sleep', 'water', 'run', 'gym', 'reflect', 'cold_shower'];
      habitTypes.forEach(habitType => {
        const cacheKey = apiCache.generateKey('habitStreak', userId, habitType);
        apiCache.delete(cacheKey);
      });
      
      return result;
    } catch (error) {
      console.error('Error in upsertDailyHabits:', error);
      return null;
    }
  }

  private buildDirectUpsertPayload(userId: string, date: string, habitData: CreateDailyHabitsData) {
    const { date: _ignored, ...habitFields } = habitData;
    return this.filterUndefinedValues({
      user_id: userId,
      date,
      ...habitFields,
    });
  }

  private buildRpcParams(userId: string, date: string, habitData: CreateDailyHabitsData) {
    return this.filterUndefinedValues({
      p_user_id: userId,
      p_date: date,
      p_sleep_hours: habitData.sleep_hours,
      p_sleep_quality: habitData.sleep_quality,
      p_sleep_notes: habitData.sleep_notes,
      p_sleep_bedtime_hours: habitData.sleep_bedtime_hours,
      p_sleep_bedtime_minutes: habitData.sleep_bedtime_minutes,
      p_sleep_wakeup_hours: habitData.sleep_wakeup_hours,
      p_sleep_wakeup_minutes: habitData.sleep_wakeup_minutes,
      // Always include water fields (even when null) so PostgREST selects the correct overload
      p_water_intake: habitData.water_intake ?? null,
      p_water_goal: habitData.water_goal ?? null,
      p_water_notes: habitData.water_notes ?? null,
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
      p_cold_shower_completed: habitData.cold_shower_completed,
      p_reflect_motivation: habitData.reflect_motivation,
      p_reflect_stress: habitData.reflect_stress,
    });
  }

  private filterUndefinedValues(obj: Record<string, any>) {
    return Object.fromEntries(
      Object.entries(obj).filter(([, value]) => value !== undefined)
    );
  }

  /**
   * Clear a single habit for a user and date
   */
  async clearHabit(userId: string, date: string, habitType: string): Promise<boolean> {
    try {
      console.log(`🗑️ Clearing habit:`, { userId, date, habitType });
      
      // Clear the habit from database
      const { error } = await supabase.rpc('clear_daily_habit', {
        p_user_id: userId,
        p_date: date,
        p_habit_type: habitType,
      });
      if (error) {
        console.error('Error clearing daily habit:', error);
        throw error;
      }

      // Deduct pillar progress and delete notification (only for today's date)
      if (date === new Date().toISOString().split('T')[0]) {
        // Map habit types to pillars
        const habitToPillarMap: { [key: string]: { pillar: string, habitKey: string } } = {
          gym: { pillar: 'strength_fitness', habitKey: 'gym' },
          run: { pillar: 'strength_fitness', habitKey: 'run' },
          cold_shower: { pillar: 'strength_fitness', habitKey: 'cold_shower' },
          water: { pillar: 'strength_fitness', habitKey: 'water' },
          reflect: { pillar: 'growth_wisdom', habitKey: 'reflect' },
          focus: { pillar: 'growth_wisdom', habitKey: 'focus' },
          sleep: { pillar: 'discipline', habitKey: 'sleep' },
          meditation: { pillar: 'growth_wisdom', habitKey: 'meditation' },
          microlearn: { pillar: 'growth_wisdom', habitKey: 'microlearn' },
        };

        const mapping = habitToPillarMap[habitType];
        if (mapping) {
          // Deduct pillar progress
          pillarProgressService.deductAction(userId, mapping.pillar as any, mapping.habitKey).catch(err => {
            console.error(`Failed to deduct ${habitType} from pillar:`, err);
          });

          // Delete the habit reward notification
          notificationService.deleteHabitRewardNotification(userId, habitType, date).catch(err => {
            console.error(`Failed to delete ${habitType} notification:`, err);
          });

          console.log(`✅ Deducted progress and removed notification for ${habitType}`);
        }
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
      const today = new Date().toISOString().split('T')[0];
      
      // Ensure endDate doesn't exceed today
      const effectiveEndDate = endDate > today ? today : endDate;
      
      let query = supabase
        .from('daily_habits')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', effectiveEndDate)
        .order('date', { ascending: false });

      // Filter by habit type - only get records where the habit is actually completed
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching habit history:', error);
        throw error;
      }

      // Filter for actually completed habits using the isHabitCompleted logic
      const completedHabits = (data || []).filter(record => {
        if (habitType === 'all') {
          // For 'all', return any record that has at least one completed habit
          return ['sleep', 'water', 'run', 'gym', 'reflect', 'cold_shower'].some(habit => 
            this.isHabitCompleted(record, habit)
          );
        } else {
          return this.isHabitCompleted(record, habitType);
        }
      });
      
      // Filter out any future dates that might have slipped through
      const filteredData = completedHabits.filter(record => record.date <= today);
      
      return filteredData;
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
   * Get streaks for multiple habits in batch (optimized)
   */
  async getHabitStreaksBatch(userId: string, habitTypes: string[]): Promise<HabitStreak[]> {
    try {
      if (habitTypes.length === 0) return [];

      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch all habit history data in one query for all habit types
      const { data, error } = await supabase
        .from('daily_habits')
        .select('*')
        .eq('user_id', userId)
        .gte('date', thirtyDaysAgo)
        .lte('date', today)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching habit history for batch streaks:', error);
        return habitTypes.map(type => ({
          habit_type: type,
          current_streak: 0,
          longest_streak: 0
        }));
      }

      // Process streaks for each habit type
      const streaks: HabitStreak[] = [];

      for (const habitType of habitTypes) {
        // Filter records for this habit type
        const habitHistory = (data || []).filter(record => {
          return this.isHabitCompleted(record, habitType);
        });

        if (habitHistory.length === 0) {
          streaks.push({
            habit_type: habitType,
            current_streak: 0,
            longest_streak: 0
          });
          continue;
        }

        // Sort by date descending
        const sortedHistory = habitHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;
        let lastDate: Date | null = null;

        for (const record of sortedHistory) {
          const recordDate = new Date(record.date);
          
          // Skip future dates
          const todayDate = new Date();
          if (recordDate > todayDate) {
            continue;
          }
          
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
        const todayRecord = habitHistory.find(h => h.date === today);
        const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const yesterdayRecord = habitHistory.find(h => h.date === yesterdayDate);
        
        if (todayRecord) {
          currentStreak = tempStreak;
        } else if (yesterdayRecord && tempStreak > 0) {
          currentStreak = tempStreak;
        } else {
          currentStreak = 0;
        }
        
        // Additional check: if the last completion was more than 2 days ago, streak is broken
        if (sortedHistory.length > 0) {
          const lastCompletionDate = new Date(sortedHistory[0].date);
          const todayDate = new Date();
          
          if (lastCompletionDate > todayDate) {
            currentStreak = 0;
          } else {
            const daysSinceLastCompletion = Math.floor((todayDate.getTime() - lastCompletionDate.getTime()) / (24 * 60 * 60 * 1000));
            
            if (daysSinceLastCompletion > 2) {
              currentStreak = 0;
            }
          }
        }

        // Update longest streak if current streak is longer
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }

        streaks.push({
          habit_type: habitType,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_completed_date: sortedHistory[0]?.date
        });
      }

      return streaks;
    } catch (error) {
      console.error('Error in getHabitStreaksBatch:', error);
      return habitTypes.map(type => ({
        habit_type: type,
        current_streak: 0,
        longest_streak: 0
      }));
    }
  }

  /**
   * Get current streak for a specific habit
   */
  async getHabitStreak(userId: string, habitType: string): Promise<HabitStreak> {
    try {
      // Check cache first
      const cacheKey = apiCache.generateKey('habitStreak', userId, habitType);
      const cached = apiCache.get<HabitStreak>(cacheKey);
      
      if (cached !== null) {
        return cached;
      }

      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const history = await this.getHabitHistory(userId, habitType, thirtyDaysAgo, today);
      
      if (history.length === 0) {
        const result = {
          habit_type: habitType,
          current_streak: 0,
          longest_streak: 0
        };
        // Cache for 3 minutes
        apiCache.set(cacheKey, result, 3 * 60 * 1000);
        return result;
      }

      // Sort by date descending
      const sortedHistory = history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let lastDate: Date | null = null;

      for (const record of sortedHistory) {
        const recordDate = new Date(record.date);
        
        // Skip future dates
        const today = new Date();
        if (recordDate > today) {
          continue;
        }
        
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
      
      // Only count as current streak if it's recent (within last 2 days)
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
      
      // Additional check: if the last completion was more than 2 days ago, streak is broken
      if (sortedHistory.length > 0) {
        const lastCompletionDate = new Date(sortedHistory[0].date);
        const today = new Date();
        
        // Only check if the date is actually in the future relative to today
        if (lastCompletionDate > today) {
          currentStreak = 0;
        } else {
          const daysSinceLastCompletion = Math.floor((today.getTime() - lastCompletionDate.getTime()) / (24 * 60 * 60 * 1000));
          
          if (daysSinceLastCompletion > 2) {
            currentStreak = 0; // Streak is broken if more than 2 days have passed
          }
        }
      }

      // Update longest streak if current streak is longer
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }

      const result = {
        habit_type: habitType,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_completed_date: sortedHistory[0]?.date
      };

      // Cache for 3 minutes
      apiCache.set(cacheKey, result, 3 * 60 * 1000);
      
      return result;
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
   * Check if a habit is completed in a record
   */
  private isHabitCompleted(record: DailyHabits, habitType: string): boolean {
    switch (habitType) {
      case 'sleep':
        return (record.sleep_hours !== null && record.sleep_hours > 0) ||
               (record.sleep_bedtime_hours !== null && record.sleep_wakeup_hours !== null);
      case 'water':
        return record.water_intake !== null && record.water_intake > 0;
      case 'run':
        return record.run_day_type === 'active';
      case 'gym':
        return record.gym_day_type === 'active';
      case 'reflect':
        return record.reflect_mood !== null;
      case 'cold_shower':
        return record.cold_shower_completed === true;
      default:
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
      const { error, data } = await supabase
        .from('user_login_days')
        .upsert(
          { user_id: userId, login_date: date },
          { onConflict: 'user_id,login_date' }
        );
      
      if (error) {
        // Log detailed error information (but only in development)
        if (__DEV__) {
          console.error('Error recording login day:', {
            error: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            userId,
            date
          });
        }
        
        // If table doesn't exist, RLS issue, or server error, don't throw - just return false
        // This prevents breaking the app if the feature isn't set up yet or server is having issues
        if (error.code === '42P01' || error.code === 'PGRST301' || error.code === undefined) {
          // Server errors (500) often have undefined error codes
          if (__DEV__) {
            console.warn('user_login_days table may not exist, has RLS restrictions, or server error. Skipping login day recording.');
          }
          return false;
        }
        
        // For other errors, still return false instead of throwing
        return false;
      }
      
      // Check login streak and track discipline pillar if > 3 days
      try {
        const streak = await this.getLoginStreak(userId);
        if (streak.currentStreak > 3) {
          pillarProgressService.trackAction(userId, 'discipline', 'login_streak').catch(() => {
            // Silently fail - this is non-critical
          });
        }
      } catch (streakError) {
        // Silently fail streak check - non-critical
      }
      
      return true;
    } catch (error: any) {
      // Additional error handling for unexpected errors (only log in development)
      if (__DEV__) {
        console.error('Error recording login day (catch block):', {
          error: error?.message || error,
          stack: error?.stack,
          userId,
          date
        });
      }
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

  /**
   * Update user's selected daily habits
   */
  async updateSelectedHabits(userId: string, habitIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          selected_daily_habits: habitIds,
          habits_last_changed: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating selected habits:', error);
      throw error;
    }
  }

  /**
   * Get user's selected daily habits
   */
  async getSelectedHabits(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('selected_daily_habits')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data?.selected_daily_habits || DEFAULT_HABITS;
    } catch (error) {
      console.error('Error getting selected habits:', error);
      return DEFAULT_HABITS;
    }
  }

  /**
   * Get habit schedules for a user
   */
  async getHabitSchedules(userId: string): Promise<Record<string, boolean[]>> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('habit_schedules')
        .eq('id', userId)
        .single();
      
      if (error) {
        // If column doesn't exist, return empty object
        if (error.code === '42703' || error.code === 'PGRST204') {
          return {};
        }
        throw error;
      }
      return data?.habit_schedules || {};
    } catch (error) {
      console.error('Error getting habit schedules:', error);
      return {};
    }
  }

  /**
   * Update habit schedule for a user
   */
  async updateHabitSchedule(userId: string, habitId: string, days: boolean[]): Promise<void> {
    try {
      // First get current schedules
      const currentSchedules = await this.getHabitSchedules(userId);
      
      // Update the specific habit schedule
      const updatedSchedules = {
        ...currentSchedules,
        [habitId]: days
      };

      const { error } = await supabase
        .from('profiles')
        .update({ 
          habit_schedules: updatedSchedules,
          habits_last_changed: new Date().toISOString()
        })
        .eq('id', userId);
      
      if (error) {
        // If column doesn't exist, we'll need to create it or use a different approach
        if (error.code === '42703' || error.code === 'PGRST204') {
          console.warn('habit_schedules column does not exist. Schedules will not be persisted.');
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error updating habit schedule:', error);
      throw error;
    }
  }

  /**
   * Remove habit schedule for a user
   */
  async removeHabitSchedule(userId: string, habitId: string): Promise<void> {
    try {
      // First get current schedules
      const currentSchedules = await this.getHabitSchedules(userId);
      
      // Remove the specific habit schedule
      const updatedSchedules = { ...currentSchedules };
      delete updatedSchedules[habitId];

      const { error } = await supabase
        .from('profiles')
        .update({ habit_schedules: updatedSchedules })
        .eq('id', userId);
      
      if (error) {
        // If column doesn't exist, we'll need to create it or use a different approach
        if (error.code === '42703' || error.code === 'PGRST204') {
          console.warn('habit_schedules column does not exist. Schedules will not be persisted.');
          return;
        }
        throw error;
      }
    } catch (error) {
      console.error('Error removing habit schedule:', error);
      throw error;
    }
  }

  /**
   * Check if habits are locked (cannot be changed for 6 weeks)
   * Returns true if locked, false if can be edited
   */
  async areHabitsLocked(userId: string): Promise<{ locked: boolean; daysRemaining?: number; unlockDate?: Date }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('habits_last_changed')
        .eq('id', userId)
        .single();

      if (error || !data?.habits_last_changed) {
        // If no timestamp exists, habits are not locked (first time setup)
        return { locked: false };
      }

      const lastChanged = new Date(data.habits_last_changed);
      const now = new Date();
      const sixWeeksInMs = 6 * 7 * 24 * 60 * 60 * 1000; // 42 days in milliseconds
      const timeSinceLastChange = now.getTime() - lastChanged.getTime();
      const daysRemaining = Math.ceil((sixWeeksInMs - timeSinceLastChange) / (24 * 60 * 60 * 1000));

      if (timeSinceLastChange >= sixWeeksInMs) {
        // 6 weeks have passed, habits can be edited
        return { locked: false };
      } else {
        // Still locked, calculate unlock date
        const unlockDate = new Date(lastChanged.getTime() + sixWeeksInMs);
        return { 
          locked: true, 
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
          unlockDate 
        };
      }
    } catch (error) {
      console.error('Error checking habits lock status:', error);
      // On error, allow editing (fail open)
      return { locked: false };
    }
  }
}

export const dailyHabitsService = new DailyHabitsService(); 