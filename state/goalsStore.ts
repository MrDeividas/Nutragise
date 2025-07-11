import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Goal, CreateGoalData, UpdateGoalData } from '../types/database';

interface GoalsState {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchGoals: (userId: string) => Promise<void>;
  createGoal: (goalData: CreateGoalData) => Promise<Goal | null>;
  updateGoal: (goalId: string, updates: UpdateGoalData) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
  toggleGoalCompletion: (goalId: string) => Promise<void>;
  clearError: () => void;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  loading: false,
  error: null,

  fetchGoals: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ goals: data || [], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createGoal: async (goalData: CreateGoalData) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('goals')
        .insert([{ 
          ...goalData, 
          user_id: user.id,
          start_date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (error) throw error;

      const currentGoals = get().goals;
      set({ 
        goals: [data, ...currentGoals], 
        loading: false 
      });
      
      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updateGoal: async (goalId: string, updates: UpdateGoalData) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', goalId);

      if (error) throw error;

      const currentGoals = get().goals;
      const updatedGoals = currentGoals.map(goal => 
        goal.id === goalId ? { ...goal, ...updates } : goal
      );
      
      set({ goals: updatedGoals, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  deleteGoal: async (goalId: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      const currentGoals = get().goals;
      const filteredGoals = currentGoals.filter(goal => goal.id !== goalId);
      
      set({ goals: filteredGoals, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  toggleGoalCompletion: async (goalId: string) => {
    const goal = get().goals.find(g => g.id === goalId);
    if (!goal) return;

    await get().updateGoal(goalId, { completed: !goal.completed });
  },

  clearError: () => set({ error: null }),
})); 