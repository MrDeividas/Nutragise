import { supabase } from './supabase';
import {
  WorkoutExercise,
  CreateWorkoutExerciseData,
} from '../types/database';

const WORKOUT_EXERCISES_TABLE = 'workout_exercises';

export const workoutService = {
  async createExercise(userId: string, payload: CreateWorkoutExerciseData): Promise<WorkoutExercise> {
    const { data, error } = await supabase
      .from<WorkoutExercise>(WORKOUT_EXERCISES_TABLE)
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

  async fetchExercises(userId: string): Promise<WorkoutExercise[]> {
    const { data, error } = await supabase
      .from<WorkoutExercise>(WORKOUT_EXERCISES_TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  },

  async updateExercise(userId: string, exerciseId: string, payload: Partial<CreateWorkoutExerciseData>): Promise<WorkoutExercise> {
    const { data, error } = await supabase
      .from<WorkoutExercise>(WORKOUT_EXERCISES_TABLE)
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', exerciseId)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async deleteExercise(userId: string, exerciseId: string): Promise<void> {
    const { error } = await supabase
      .from<WorkoutExercise>(WORKOUT_EXERCISES_TABLE)
      .delete()
      .eq('id', exerciseId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }
  },
};

