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

  async fetchCompletionsForMonth(userId: string, habitId: string, year: number, month: number): Promise<CustomHabitCompletion[]> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    
    const { data, error } = await supabase
      .from<CustomHabitCompletion>(COMPLETIONS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .gte('occur_date', startDate)
      .lte('occur_date', endDate);

    if (error) {
      throw new Error(error.message);
    }

    return data ?? [];
  },

  async fetchCompletionsForRange(
    userId: string,
    habitId: string,
    startDate: string,
    endDate: string
  ): Promise<CustomHabitCompletion[]> {
    const { data, error } = await supabase
      .from<CustomHabitCompletion>(COMPLETIONS_TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .gte('occur_date', startDate)
      .lte('occur_date', endDate);

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
    // First, check for active partnerships
    const { data: partnerships } = await supabase
      .from('habit_accountability_partners')
      .select('*, partner:profiles!habit_accountability_partners_inviter_id_fkey(username, display_name), partner2:profiles!habit_accountability_partners_invitee_id_fkey(username, display_name)')
      .or(`inviter_habit_id.eq.${habitId},invitee_habit_id.eq.${habitId}`)
      .eq('status', 'accepted');

    // Cancel all active partnerships for this habit
    if (partnerships && partnerships.length > 0) {
      console.log(`[DeleteHabit] Cancelling ${partnerships.length} partnerships for habit ${habitId}`);
      
      for (const partnership of partnerships) {
        // Cancel the partnership
        await supabase
          .from('habit_accountability_partners')
          .update({ status: 'cancelled' })
          .eq('id', partnership.id);
        
        // Notify the partner
        const partnerId = partnership.inviter_id === userId ? partnership.invitee_id : partnership.inviter_id;
        const partnerProfile = partnership.inviter_id === userId ? partnership.partner2 : partnership.partner;
        
        try {
          const { default: notificationService } = await import('./notificationService');
          await notificationService.createNotification({
            user_id: partnerId,
            from_user_id: userId,
            notification_type: 'habit_invite_accepted', // Reusing type for general habit notifications
            message: 'deleted a habit you were tracking together. Partnership cancelled.',
          });
        } catch (notifError) {
          console.error('[DeleteHabit] Error sending notification:', notifError);
          // Don't fail the deletion if notification fails
        }
      }
    }

    // Now delete the habit
    const { error } = await supabase
      .from(HABITS_TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('id', habitId);

    if (error) {
      throw new Error(error.message);
    }
  },
  
  // Check if a habit has active partnerships
  async getActivePartnerships(userId: string, habitId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('habit_accountability_partners')
      .select('*, partner:profiles!habit_accountability_partners_inviter_id_fkey(username, display_name), partner2:profiles!habit_accountability_partners_invitee_id_fkey(username, display_name)')
      .or(`inviter_habit_id.eq.${habitId},invitee_habit_id.eq.${habitId}`)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching partnerships:', error);
      return [];
    }

    return data || [];
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

