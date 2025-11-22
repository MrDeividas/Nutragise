import { supabase } from './supabase';
import {
  CompleteHabitPayload,
  CreateCustomHabitInput,
  CustomHabit,
  CustomHabitCompletion,
} from '../types/database';

const HABITS_TABLE = 'custom_habits';
const COMPLETIONS_TABLE = 'custom_habit_completions';

export const habitsService = {
  async createHabit(userId: string, payload: CreateCustomHabitInput): Promise<CustomHabit> {
    const { data, error } = await supabase
      .from<CustomHabit>(HABITS_TABLE)
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

  async fetchHabits(userId: string): Promise<CustomHabit[]> {
    const { data, error } = await supabase
      .from<CustomHabit>(HABITS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  },

  async fetchCompletions(userId: string, date: string): Promise<CustomHabitCompletion[]> {
    const { data, error } = await supabase
      .from<CustomHabitCompletion>(COMPLETIONS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('occur_date', date);

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  },

  async updateHabit(userId: string, habitId: string, payload: Partial<CreateCustomHabitInput>): Promise<CustomHabit> {
    const { data, error } = await supabase
      .from<CustomHabit>(HABITS_TABLE)
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('id', habitId)
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async archiveHabit(userId: string, habitId: string): Promise<void> {
    const { error } = await supabase
      .from(HABITS_TABLE)
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('id', habitId);

    if (error) {
      throw new Error(error.message);
    }
  },

  async deleteHabit(userId: string, habitId: string): Promise<void> {
    const { error } = await supabase
      .from(HABITS_TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('id', habitId);

    if (error) {
      throw new Error(error.message);
    }
  },

  async upsertCompletion(userId: string, payload: CompleteHabitPayload): Promise<CustomHabitCompletion> {
    const { data, error } = await supabase
      .from<CustomHabitCompletion>(COMPLETIONS_TABLE)
      .upsert(
        {
          habit_id: payload.habit_id,
          user_id: userId,
          occur_date: payload.occur_date,
          status: payload.status ?? 'completed',
          value: payload.value,
          note: payload.note,
        },
        {
          onConflict: 'habit_id,occur_date',
        }
      )
      .select('*')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  async deleteCompletion(userId: string, habitId: string, occurDate: string): Promise<void> {
    const { error } = await supabase
      .from(COMPLETIONS_TABLE)
      .delete()
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .eq('occur_date', occurDate);

    if (error) {
      throw new Error(error.message);
    }
  },
};

