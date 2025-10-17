import { supabase } from './supabase';
import { DailyHabits } from '../types/database';

interface DailyPointsBreakdown {
  daily: number;
  core: number;
  bonus: number;
  total: number;
}

interface UserPointsDaily {
  user_id: string;
  date: string;
  gym_completed: boolean;
  meditation_completed: boolean;
  microlearn_completed: boolean;
  sleep_completed: boolean;
  water_completed: boolean;
  run_completed: boolean;
  reflect_completed: boolean;
  cold_shower_completed: boolean;
  liked_today: boolean;
  commented_today: boolean;
  shared_today: boolean;
  updated_goal_today: boolean;
  daily_habits_points: number;
  core_habits_points: number;
  bonus_points: number;
  total_points_today: number;
}

class PointsService {
  // Points values
  private readonly DAILY_HABIT_POINTS = 15;
  private readonly LIKE_POINTS = 10;
  private readonly COMMENT_POINTS = 10;
  private readonly SHARE_POINTS = 15;
  private readonly UPDATE_GOAL_POINTS = 25;
  private readonly BONUS_POINTS = 20;

  /**
   * Get the current date adjusted for 4am cutoff
   * If it's before 4am, return previous day
   */
  private getCurrentDateFor4amCutoff(): string {
    const now = new Date();
    const hour = now.getHours();
    
    // If before 4am, use previous day
    if (hour < 4) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    }
    
    return now.toISOString().split('T')[0];
  }

  /**
   * Check if a given date is today (accounting for 4am cutoff)
   */
  private isToday(dateString: string): boolean {
    const today = this.getCurrentDateFor4amCutoff();
    return dateString === today;
  }

  /**
   * Calculate points from daily habits data
   */
  calculateDailyHabitsPoints(dailyHabits: DailyHabits): number {
    let points = 0;
    
    // Gym
    if (dailyHabits.gym_day_type || dailyHabits.gym_training_types) {
      points += this.DAILY_HABIT_POINTS;
    }
    
    // Sleep
    if (dailyHabits.sleep_hours || dailyHabits.sleep_quality) {
      points += this.DAILY_HABIT_POINTS;
    }
    
    // Water
    if (dailyHabits.water_intake) {
      points += this.DAILY_HABIT_POINTS;
    }
    
    // Run
    if (dailyHabits.run_day_type || dailyHabits.run_activity_type) {
      points += this.DAILY_HABIT_POINTS;
    }
    
    // Reflect
    if (dailyHabits.reflect_mood || dailyHabits.reflect_energy || dailyHabits.reflect_what_went_well) {
      points += this.DAILY_HABIT_POINTS;
    }
    
    // Cold Shower
    if (dailyHabits.cold_shower_completed) {
      points += this.DAILY_HABIT_POINTS;
    }
    
    // Note: Meditation and Microlearn are tracked separately (not in DB)
    // They will be tracked via trackDailyHabit function
    
    return points;
  }

  /**
   * Track a daily habit completion (for habits not in daily_habits table like meditation/microlearn)
   */
  async trackDailyHabit(
    userId: string, 
    habitType: 'meditation' | 'microlearn',
    date?: string
  ): Promise<boolean> {
    try {
      const targetDate = date || this.getCurrentDateFor4amCutoff();

      // Get or create today's record
      const { data: existing, error: fetchError } = await supabase
        .from('user_points_daily')
        .select('*')
        .eq('user_id', userId)
        .eq('date', targetDate)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching daily points:', fetchError);
        return false;
      }

      const habitField = habitType === 'meditation' ? 'meditation_completed' : 'microlearn_completed';
      
      // If already completed, don't do it again
      if (existing && existing[habitField]) {
        return false;
      }

      const currentDailyPoints = existing?.daily_habits_points || 0;
      const newDailyPoints = currentDailyPoints + this.DAILY_HABIT_POINTS;

      const updateData: any = {
        [habitField]: true,
        daily_habits_points: newDailyPoints,
        total_points_today: newDailyPoints + (existing?.core_habits_points || 0) + (existing?.bonus_points || 0)
      };

      if (existing) {
        const { error } = await supabase
          .from('user_points_daily')
          .update(updateData)
          .eq('user_id', userId)
          .eq('date', targetDate);

        if (error) {
          console.error('Error updating daily habit:', error);
          return false;
        }
      } else {
        const { error } = await supabase
          .from('user_points_daily')
          .insert({
            user_id: userId,
            date: targetDate,
            ...updateData
          });

        if (error) {
          console.error('Error inserting daily habit:', error);
          return false;
        }
      }
      
      // Check for bonus
      await this.checkAndAwardBonus(userId, targetDate);

      return true;
    } catch (error) {
      console.error('Error in trackDailyHabit:', error);
      return false;
    }
  }

  /**
   * Update daily habits points when habits are saved
   * Now just updates the daily record - total is calculated live
   */
  async updateDailyHabitsPoints(userId: string, dailyHabits: DailyHabits, date: string): Promise<void> {
    try {
      const points = this.calculateDailyHabitsPoints(dailyHabits);
      
      // Get existing record
      const { data: existing, error: fetchError } = await supabase
        .from('user_points_daily')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching daily points:', fetchError);
        return;
      }

      // Calculate which habits are completed
      const habitCompletions = {
        gym_completed: !!(dailyHabits.gym_day_type || dailyHabits.gym_training_types),
        sleep_completed: !!(dailyHabits.sleep_hours || dailyHabits.sleep_quality),
        water_completed: !!dailyHabits.water_intake,
        run_completed: !!(dailyHabits.run_day_type || dailyHabits.run_activity_type),
        reflect_completed: !!(dailyHabits.reflect_mood || dailyHabits.reflect_energy || dailyHabits.reflect_what_went_well),
        cold_shower_completed: !!dailyHabits.cold_shower_completed,
        // Keep meditation and microlearn from existing record
        meditation_completed: existing?.meditation_completed || false,
        microlearn_completed: existing?.microlearn_completed || false
      };

      const newDailyPoints = points + 
        (habitCompletions.meditation_completed ? this.DAILY_HABIT_POINTS : 0) +
        (habitCompletions.microlearn_completed ? this.DAILY_HABIT_POINTS : 0);

      const updateData = {
        ...habitCompletions,
        daily_habits_points: newDailyPoints,
        total_points_today: newDailyPoints + (existing?.core_habits_points || 0) + (existing?.bonus_points || 0)
      };

      if (existing) {
        const { error } = await supabase
          .from('user_points_daily')
          .update(updateData)
          .eq('user_id', userId)
          .eq('date', date);

        if (error) {
          console.error('Error updating daily points:', error);
          return;
        }
      } else {
        const { error } = await supabase
          .from('user_points_daily')
          .insert({
            user_id: userId,
            date,
            ...updateData
          });

        if (error) {
          console.error('Error inserting daily points:', error);
          return;
        }
      }

      // Check for bonus
      await this.checkAndAwardBonus(userId, date);
    } catch (error) {
      console.error('Error in updateDailyHabitsPoints:', error);
    }
  }

  /**
   * Check if user has active likes today and update points accordingly
   */
  async updateLikeStatus(userId: string): Promise<void> {
    try {
      const targetDate = this.getCurrentDateFor4amCutoff();
      
      // Check if user has any active likes today (post_likes or goal_likes)
      const [{ count: postLikes }, { count: goalLikes }] = await Promise.all([
        supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', `${targetDate}T00:00:00`)
          .lt('created_at', `${targetDate}T23:59:59`),
        supabase
          .from('goal_likes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', `${targetDate}T00:00:00`)
          .lt('created_at', `${targetDate}T23:59:59`)
      ]);

      const hasActiveLikes = (postLikes || 0) + (goalLikes || 0) > 0;
      
      // Update the daily record
      await this.updateCoreHabitStatus(userId, 'like', hasActiveLikes, targetDate);
    } catch (error) {
      console.error('Error updating like status:', error);
    }
  }

  /**
   * Check if user has active comments today and update points accordingly
   */
  async updateCommentStatus(userId: string): Promise<void> {
    try {
      const targetDate = this.getCurrentDateFor4amCutoff();
      
      // Check if user has any active comments today (post_comments or goal_comments)
      const [{ count: postComments }, { count: goalComments }] = await Promise.all([
        supabase
          .from('post_comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', `${targetDate}T00:00:00`)
          .lt('created_at', `${targetDate}T23:59:59`),
        supabase
          .from('goal_comments')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', `${targetDate}T00:00:00`)
          .lt('created_at', `${targetDate}T23:59:59`)
      ]);

      const hasActiveComments = (postComments || 0) + (goalComments || 0) > 0;
      
      // Update the daily record
      await this.updateCoreHabitStatus(userId, 'comment', hasActiveComments, targetDate);
    } catch (error) {
      console.error('Error updating comment status:', error);
    }
  }

  /**
   * Update core habit status (like/comment) based on actual active records
   */
  private async updateCoreHabitStatus(
    userId: string,
    habitType: 'like' | 'comment',
    isActive: boolean,
    date: string
  ): Promise<void> {
    try {
      // Get existing record
      const { data: existing, error: fetchError } = await supabase
        .from('user_points_daily')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching daily points:', fetchError);
        return;
      }

      const field = habitType === 'like' ? 'liked_today' : 'commented_today';
      const points = habitType === 'like' ? this.LIKE_POINTS : this.COMMENT_POINTS;
      
      // Calculate new core points
      let currentCorePoints = existing?.core_habits_points || 0;
      
      // If status changed, update points
      if (isActive && !existing?.[field]) {
        // Add points
        currentCorePoints += points;
      } else if (!isActive && existing?.[field]) {
        // Remove points
        currentCorePoints -= points;
      } else {
        // No change needed
        return;
      }

      const updateData = {
        [field]: isActive,
        core_habits_points: Math.max(0, currentCorePoints),
        total_points_today: (existing?.daily_habits_points || 0) + Math.max(0, currentCorePoints) + (existing?.bonus_points || 0)
      };

      if (existing) {
        await supabase
          .from('user_points_daily')
          .update(updateData)
          .eq('user_id', userId)
          .eq('date', date);
      } else {
        await supabase
          .from('user_points_daily')
          .insert({
            user_id: userId,
            date,
            ...updateData
          });
      }

      // Check for bonus (might lose it if removing like/comment)
      await this.checkAndAwardBonus(userId, date);
    } catch (error) {
      console.error('Error updating core habit status:', error);
    }
  }

  /**
   * Track core habit completion (for share and update_goal which work on action, not state)
   */
  async trackCoreHabit(
    userId: string, 
    habitType: 'like' | 'comment' | 'share' | 'update_goal',
    date?: string
  ): Promise<boolean> {
    try {
      const targetDate = date || this.getCurrentDateFor4amCutoff();

      // For like and comment, update status based on active records
      if (habitType === 'like') {
        await this.updateLikeStatus(userId);
        return true;
      } else if (habitType === 'comment') {
        await this.updateCommentStatus(userId);
        return true;
      }

      // For share and update_goal, track the action (not state-based)
      const { data: existing, error: fetchError } = await supabase
        .from('user_points_daily')
        .select('*')
        .eq('user_id', userId)
        .eq('date', targetDate)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching daily points:', fetchError);
        return false;
      }

      const fieldMap = {
        share: 'shared_today',
        update_goal: 'updated_goal_today'
      };

      const pointsMap = {
        share: this.SHARE_POINTS,
        update_goal: this.UPDATE_GOAL_POINTS
      };

      const field = fieldMap[habitType as 'share' | 'update_goal'];
      const pointsToAdd = pointsMap[habitType as 'share' | 'update_goal'];
      
      // Check if already completed today (share is now once per day like like/comment)
      if (habitType === 'share' && existing && existing[field]) {
        return false; // Already shared today
      }
      
      const currentCorePoints = existing?.core_habits_points || 0;
      const newCorePoints = currentCorePoints + pointsToAdd;

      const updateData: any = {
        [field]: true,
        core_habits_points: newCorePoints,
        total_points_today: (existing?.daily_habits_points || 0) + newCorePoints + (existing?.bonus_points || 0)
      };

      if (existing) {
        const { error } = await supabase
          .from('user_points_daily')
          .update(updateData)
          .eq('user_id', userId)
          .eq('date', targetDate);

        if (error) {
          console.error('Error updating core habit:', error);
          return false;
        }
      } else {
        const { error } = await supabase
          .from('user_points_daily')
          .insert({
            user_id: userId,
            date: targetDate,
            ...updateData
          });

        if (error) {
          console.error('Error inserting core habit:', error);
          return false;
        }
      }
      
      await this.checkAndAwardBonus(userId, targetDate);

      return true;
    } catch (error) {
      console.error('Error in trackCoreHabit:', error);
      return false;
    }
  }

  /**
   * Check if all habits are completed and award bonus
   */
  async checkAndAwardBonus(userId: string, date: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('user_points_daily')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      if (error || !data) return;

      // Check if bonus already awarded
      if (data.bonus_points > 0) return;

      // Check if all 8 daily habits are completed
      const allDailyHabitsComplete = 
        data.gym_completed &&
        data.meditation_completed &&
        data.microlearn_completed &&
        data.sleep_completed &&
        data.water_completed &&
        data.run_completed &&
        data.reflect_completed &&
        data.cold_shower_completed;

      // Check if all 4 core habits are completed
      const allCoreHabitsComplete = 
        data.liked_today &&
        data.commented_today &&
        data.shared_today &&
        data.updated_goal_today;

      if (allDailyHabitsComplete && allCoreHabitsComplete) {
        // Award bonus
        const { error: updateError } = await supabase
          .from('user_points_daily')
          .update({
            bonus_points: this.BONUS_POINTS,
            total_points_today: data.total_points_today + this.BONUS_POINTS
          })
          .eq('user_id', userId)
          .eq('date', date);

        if (updateError) {
          console.error('Error awarding bonus:', updateError);
          return;
        }

        // Update total points
        await this.updateTotalPoints(userId, this.BONUS_POINTS);
      }
    } catch (error) {
      console.error('Error in checkAndAwardBonus:', error);
    }
  }

  /**
   * Get today's points breakdown
   */
  async getTodaysPoints(userId: string): Promise<DailyPointsBreakdown> {
    try {
      const today = this.getCurrentDateFor4amCutoff();
      
      const { data, error } = await supabase
        .from('user_points_daily')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching today\'s points:', error);
        return { daily: 0, core: 0, bonus: 0, total: 0 };
      }

      if (!data) {
        return { daily: 0, core: 0, bonus: 0, total: 0 };
      }

      return {
        daily: data.daily_habits_points,
        core: data.core_habits_points,
        bonus: data.bonus_points,
        total: data.total_points_today
      };
    } catch (error) {
      console.error('Error in getTodaysPoints:', error);
      return { daily: 0, core: 0, bonus: 0, total: 0 };
    }
  }

  /**
   * Get cumulative total points - CALCULATED LIVE from daily records
   */
  async getTotalPoints(userId: string): Promise<number> {
    try {
      // Get all daily records and sum up the points
      const { data, error } = await supabase
        .from('user_points_daily')
        .select('total_points_today')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching daily points records:', error);
        return 0;
      }

      // Sum all the daily points
      const total = data?.reduce((sum, record) => sum + (record.total_points_today || 0), 0) || 0;
      return total;
    } catch (error) {
      console.error('Error in getTotalPoints:', error);
      return 0;
    }
  }

  /**
   * Update cumulative total points
   */
  private async updateTotalPoints(userId: string, pointsToAdd: number): Promise<void> {
    try {
      const { data: existing, error: fetchError } = await supabase
        .from('user_points_total')
        .select('total_points')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching total points:', fetchError);
        return;
      }

      const newTotal = (existing?.total_points || 0) + pointsToAdd;

      if (existing) {
        const { error } = await supabase
          .from('user_points_total')
          .update({ total_points: newTotal })
          .eq('user_id', userId);

        if (error) {
          console.error('Error updating total points:', error);
        }
      } else {
        const { error } = await supabase
          .from('user_points_total')
          .insert({
            user_id: userId,
            total_points: newTotal
          });

        if (error) {
          console.error('Error inserting total points:', error);
        }
      }
    } catch (error) {
      console.error('Error in updateTotalPoints:', error);
    }
  }
  
  /**
   * Note: user_points_total table is now DEPRECATED
   * We keep it for potential future use but getTotalPoints() now calculates live
   */

  /**
   * Get core habits completion status for today
   */
  async getCoreHabitsStatus(userId: string): Promise<{
    liked: boolean;
    commented: boolean;
    shared: boolean;
    updatedGoal: boolean;
    bonus: boolean;
  }> {
    try {
      const today = this.getCurrentDateFor4amCutoff();
      
      const { data, error } = await supabase
        .from('user_points_daily')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching core habits status:', error);
        return { liked: false, commented: false, shared: false, updatedGoal: false, bonus: false };
      }

      if (!data) {
        return { liked: false, commented: false, shared: false, updatedGoal: false, bonus: false };
      }

      return {
        liked: data.liked_today,
        commented: data.commented_today,
        shared: data.shared_today,
        updatedGoal: data.updated_goal_today,
        bonus: data.bonus_points > 0
      };
    } catch (error) {
      console.error('Error in getCoreHabitsStatus:', error);
      return { liked: false, commented: false, shared: false, updatedGoal: false, bonus: false };
    }
  }

  /**
   * Get current level based on total points
   * Level 1: 0-3999 pts
   * Level 2: 4000-7999 pts
   * Level 3: 8000-11999 pts
   * Level 4: 12000+ pts
   */
  getCurrentLevel(totalPoints: number): number {
    if (totalPoints >= 12000) return 4;
    if (totalPoints >= 8000) return 3;
    if (totalPoints >= 4000) return 2;
    return 1;
  }

  /**
   * Get level progress information
   * Returns current level, next level, points within current level, and segments filled
   */
  getLevelProgress(totalPoints: number): {
    currentLevel: number;
    nextLevel: number;
    pointsInCurrentLevel: number;
    pointsNeededForNext: number;
    segmentsFilled: number; // out of 20
  } {
    const currentLevel = this.getCurrentLevel(totalPoints);
    const levelStartPoints = (currentLevel - 1) * 4000;
    const pointsInCurrentLevel = totalPoints - levelStartPoints;
    const segmentsFilled = Math.floor(pointsInCurrentLevel / 200);
    
    return {
      currentLevel,
      nextLevel: currentLevel < 4 ? currentLevel + 1 : 4,
      pointsInCurrentLevel,
      pointsNeededForNext: currentLevel < 4 ? 4000 - pointsInCurrentLevel : 0,
      segmentsFilled: Math.min(segmentsFilled, 20)
    };
  }
}

export const pointsService = new PointsService();

