import { supabase } from './supabase';
import {
  WorkoutSplit,
  CreateWorkoutSplitData,
  WorkoutCompletion,
  WorkoutSplitDay,
} from '../types/database';

const WORKOUT_SPLITS_TABLE = 'user_workout_splits';
const WORKOUT_COMPLETIONS_TABLE = 'workout_completions';

export const workoutSplitService = {
  async createSplit(userId: string, payload: CreateWorkoutSplitData): Promise<WorkoutSplit> {
    const { data, error } = await supabase
      .from<WorkoutSplit>(WORKOUT_SPLITS_TABLE)
      .insert({
        ...payload,
        user_id: userId,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async getActiveSplit(userId: string): Promise<WorkoutSplit | null> {
    const { data, error } = await supabase
      .from<WorkoutSplit>(WORKOUT_SPLITS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No active split found
        return null;
      }
      throw new Error(error.message);
    }

    return data;
  },

  async getAllSplits(userId: string): Promise<WorkoutSplit[]> {
    const { data, error } = await supabase
      .from<WorkoutSplit>(WORKOUT_SPLITS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  },

  async setActiveSplit(userId: string, splitId: string): Promise<void> {
    // First, deactivate all splits for this user
    const { error: deactivateError } = await supabase
      .from<WorkoutSplit>(WORKOUT_SPLITS_TABLE)
      .update({ is_active: false })
      .eq('user_id', userId);

    if (deactivateError) {
      throw new Error(deactivateError.message);
    }

    // Then activate the selected split
    const { error: activateError } = await supabase
      .from<WorkoutSplit>(WORKOUT_SPLITS_TABLE)
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', splitId)
      .eq('user_id', userId);

    if (activateError) {
      throw new Error(activateError.message);
    }
  },

  async updateSplit(userId: string, splitId: string, payload: Partial<CreateWorkoutSplitData>): Promise<WorkoutSplit> {
    const { data, error } = await supabase
      .from<WorkoutSplit>(WORKOUT_SPLITS_TABLE)
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', splitId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async deleteSplit(userId: string, splitId: string): Promise<void> {
    const { error } = await supabase
      .from<WorkoutSplit>(WORKOUT_SPLITS_TABLE)
      .delete()
      .eq('id', splitId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  },

  async getNextWorkout(userId: string): Promise<{ day: WorkoutSplitDay; dayIndex: number } | null> {
    const activeSplit = await this.getActiveSplit(userId);
    
    if (!activeSplit || !activeSplit.days || activeSplit.days.length === 0) {
      return null;
    }

    // Get all completions for this split
    const { data: completions, error } = await supabase
      .from<WorkoutCompletion>(WORKOUT_COMPLETIONS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('split_id', activeSplit.id)
      .order('completed_date', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    const today = new Date().toISOString().split('T')[0];
    const todayCompletions = completions?.filter(c => c.completed_date === today) || [];

    // Find the first uncompleted day in sequence
    for (let i = 0; i < activeSplit.days.length; i++) {
      const isCompletedToday = todayCompletions.some(c => c.day_index === i);
      if (!isCompletedToday) {
        return {
          day: activeSplit.days[i],
          dayIndex: i,
        };
      }
    }

    // If all days are completed today, check if we should reset
    // For now, if all days completed, return the first day
    if (todayCompletions.length >= activeSplit.days.length) {
      return {
        day: activeSplit.days[0],
        dayIndex: 0,
      };
    }

    // Default to first day if no completions
    return {
      day: activeSplit.days[0],
      dayIndex: 0,
    };
  },

  async completeWorkout(userId: string, splitId: string, dayIndex: number): Promise<WorkoutCompletion> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from<WorkoutCompletion>(WORKOUT_COMPLETIONS_TABLE)
      .insert({
        user_id: userId,
        split_id: splitId,
        day_index: dayIndex,
        completed_date: today,
      })
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async getCompletions(userId: string, splitId: string): Promise<WorkoutCompletion[]> {
    const { data, error } = await supabase
      .from<WorkoutCompletion>(WORKOUT_COMPLETIONS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('split_id', splitId)
      .order('completed_date', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  },

  async getAllCompletions(userId: string): Promise<WorkoutCompletion[]> {
    const { data, error } = await supabase
      .from<WorkoutCompletion>(WORKOUT_COMPLETIONS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('completed_date', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  },
};
