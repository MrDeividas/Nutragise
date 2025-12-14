import { supabase } from './supabase';
import {
  WorkoutExerciseLog,
  CreateWorkoutExerciseLogData,
} from '../types/database';
import { workoutService } from './workoutService';

const WORKOUT_EXERCISE_LOGS_TABLE = 'workout_exercise_logs';
const WORKOUT_EXERCISES_TABLE = 'workout_exercises';

export const workoutExerciseLogService = {
  async saveExerciseLog(userId: string, payload: CreateWorkoutExerciseLogData & { logId?: string }): Promise<WorkoutExerciseLog> {
    // If logId is provided, update existing log
    if (payload.logId) {
      const { data, error } = await supabase
        .from<WorkoutExerciseLog>(WORKOUT_EXERCISE_LOGS_TABLE)
        .update({
          weight: payload.weight,
          sets: payload.sets,
          reps: payload.reps,
          goal_weight: payload.goal_weight,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.logId)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } else {
      // Create new log (allow multiple logs per exercise per completion)
      const { data, error } = await supabase
        .from<WorkoutExerciseLog>(WORKOUT_EXERCISE_LOGS_TABLE)
        .insert({
          completion_id: payload.completion_id,
          exercise_name: payload.exercise_name,
          weight: payload.weight,
          sets: payload.sets,
          reps: payload.reps,
          goal_weight: payload.goal_weight,
          user_id: userId,
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    }
  },

  async getExerciseLogsForCompletion(completionId: string): Promise<WorkoutExerciseLog[]> {
    const { data, error } = await supabase
      .from<WorkoutExerciseLog>(WORKOUT_EXERCISE_LOGS_TABLE)
      .select('*')
      .eq('completion_id', completionId)
      .order('exercise_name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  },

  async getPreviousExerciseData(userId: string, exerciseName: string): Promise<{
    weight?: number | null;
    sets?: number | null;
    reps?: number | null;
    goal_weight?: number | null;
  }> {
    // First check workout_exercise_logs for most recent completion
    const { data: recentLog } = await supabase
      .from<WorkoutExerciseLog>(WORKOUT_EXERCISE_LOGS_TABLE)
      .select('weight, sets, reps, goal_weight, created_at')
      .eq('user_id', userId)
      .eq('exercise_name', exerciseName)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Also check workout_exercises table for saved exercise data
    const { data: savedExercise } = await supabase
      .from<any>(WORKOUT_EXERCISES_TABLE)
      .select('current_weight, sets, reps, goal_weight')
      .eq('user_id', userId)
      .eq('exercise_name', exerciseName)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Combine data, prioritizing recent log but falling back to saved exercise
    return {
      weight: recentLog?.weight ?? savedExercise?.current_weight ?? null,
      sets: recentLog?.sets ?? savedExercise?.sets ?? null,
      reps: recentLog?.reps ?? savedExercise?.reps ?? null,
      goal_weight: recentLog?.goal_weight ?? savedExercise?.goal_weight ?? null,
    };
  },

  async getHighestWeightAndReps(userId: string, exerciseName: string): Promise<{
    weight?: number | null;
    reps?: number | null;
  }> {
    // Get all logs for this exercise
    const { data: logs, error } = await supabase
      .from<WorkoutExerciseLog>(WORKOUT_EXERCISE_LOGS_TABLE)
      .select('weight, reps')
      .eq('user_id', userId)
      .eq('exercise_name', exerciseName)
      .not('weight', 'is', null)
      .order('created_at', { ascending: false });

    if (error || !logs || logs.length === 0) {
      return { weight: null, reps: null };
    }

    // Find the log with the highest weight
    let highestWeight = 0;
    let associatedReps: number | null = null;

    for (const log of logs) {
      if (log.weight && log.weight > highestWeight) {
        highestWeight = log.weight;
        associatedReps = log.reps ?? null;
      }
    }

    return {
      weight: highestWeight > 0 ? highestWeight : null,
      reps: associatedReps,
    };
  },

  async getExerciseHistory(userId: string, exerciseName: string): Promise<WorkoutExerciseLog[]> {
    const { data, error } = await supabase
      .from<WorkoutExerciseLog>(WORKOUT_EXERCISE_LOGS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_name', exerciseName)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  },

  async deleteExerciseLog(userId: string, logId: string): Promise<void> {
    const { error } = await supabase
      .from<WorkoutExerciseLog>(WORKOUT_EXERCISE_LOGS_TABLE)
      .delete()
      .eq('id', logId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  },
};

