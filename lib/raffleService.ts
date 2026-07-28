/**
 * Raffle Service
 * Manages raffle entries and giveaways
 */

import { supabase } from './supabase';
import { storeService } from './storeService';

export interface Raffle {
  id: string;
  title: string;
  description?: string;
  prize_amount: number;
  draw_date: string;
  status: 'upcoming' | 'active' | 'completed';
  ticket_item_id?: string;
  winner_id?: string;
  created_at: string;
}

export interface RaffleEntry {
  id: string;
  raffle_id: string;
  user_id: string;
  ticket_used_id?: string;
  entered_at: string;
}

export interface CountdownParts {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
}

/** Diamonds (tokens) required to enter an active raffle */
export const RAFFLE_ENTRY_TOKEN_COST = 2;

/** Last moment of the current calendar month (local time). */
export function getEndOfMonthDeadline(from: Date = new Date()): Date {
  return new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function getCountdownParts(deadline: Date, now: Date = new Date()): CountdownParts {
  const totalMs = Math.max(0, deadline.getTime() - now.getTime());
  const totalSec = Math.floor(totalMs / 1000);
  return {
    totalMs,
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    isComplete: totalMs <= 0,
  };
}

class RaffleService {
  /**
   * Ensure the active raffle's draw_date is end of the current month.
   * Keeps DB aligned with the monthly draw schedule.
   */
  async syncActiveRaffleDrawToMonthEnd(): Promise<void> {
    try {
      const raffle = await this.getCurrentRaffle();
      if (!raffle || raffle.status === 'completed') return;

      const deadline = getEndOfMonthDeadline();
      const existing = new Date(raffle.draw_date);
      // Same calendar month/year already set → skip
      if (
        existing.getFullYear() === deadline.getFullYear() &&
        existing.getMonth() === deadline.getMonth() &&
        existing.getDate() === deadline.getDate()
      ) {
        return;
      }

      await supabase
        .from('raffles')
        .update({ draw_date: deadline.toISOString() })
        .eq('id', raffle.id);
    } catch (error) {
      console.warn('syncActiveRaffleDrawToMonthEnd:', error);
    }
  }

  /**
   * Get the current active raffle
   */
  async getCurrentRaffle(): Promise<Raffle | null> {
    try {
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .eq('status', 'active')
        .order('draw_date', { ascending: true })
        .limit(1)
        .single();

      if (error) {
        // If no active raffle, try to get upcoming
        const { data: upcomingData, error: upcomingError } = await supabase
          .from('raffles')
          .select('*')
          .eq('status', 'upcoming')
          .order('draw_date', { ascending: true })
          .limit(1)
          .single();

        if (upcomingError) {
          console.log('No active or upcoming raffles found');
          return null;
        }

        return upcomingData;
      }

      return data;
    } catch (error) {
      console.error('Error in getCurrentRaffle:', error);
      return null;
    }
  }

  /**
   * Get all raffles
   */
  async getAllRaffles(): Promise<Raffle[]> {
    try {
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .order('draw_date', { ascending: false });

      if (error) {
        console.error('Error fetching raffles:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllRaffles:', error);
      return [];
    }
  }

  /**
   * Check if user has entered a raffle
   */
  async hasUserEntered(userId: string, raffleId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('raffle_entries')
        .select('id')
        .eq('user_id', userId)
        .eq('raffle_id', raffleId)
        .single();

      return !!data && !error;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user's raffle entries
   */
  async getUserEntries(userId: string): Promise<RaffleEntry[]> {
    try {
      const { data, error } = await supabase
        .from('raffle_entries')
        .select('*')
        .eq('user_id', userId)
        .order('entered_at', { ascending: false });

      if (error) {
        console.error('Error fetching user entries:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserEntries:', error);
      return [];
    }
  }

  /**
   * Get entry count for a raffle
   */
  async getEntryCount(raffleId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('raffle_entries')
        .select('*', { count: 'exact', head: true })
        .eq('raffle_id', raffleId);

      if (error) {
        console.error('Error fetching entry count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getEntryCount:', error);
      return 0;
    }
  }

  /**
   * Enter a raffle (costs diamonds / tokens)
   */
  async enterRaffle(
    userId: string, 
    raffleId: string
  ): Promise<{ success: boolean; message: string; newTokenBalance?: number }> {
    try {
      // 1. Get raffle details
      const { data: raffle, error: raffleError } = await supabase
        .from('raffles')
        .select('*')
        .eq('id', raffleId)
        .single();

      if (raffleError || !raffle) {
        return { success: false, message: 'Raffle not found' };
      }

      // 2. Check if raffle is active
      if (raffle.status !== 'active' && raffle.status !== 'upcoming') {
        return { success: false, message: 'This raffle is no longer accepting entries' };
      }

      // 3. Check if user already entered
      const alreadyEntered = await this.hasUserEntered(userId, raffleId);
      if (alreadyEntered) {
        return { success: false, message: 'You have already entered this raffle' };
      }

      // 4. Charge diamonds
      const deduct = await storeService.deductTokens(userId, RAFFLE_ENTRY_TOKEN_COST);
      if (!deduct.success) {
        return { success: false, message: deduct.message };
      }

      // 5. Create raffle entry
      const { error: entryError } = await supabase
        .from('raffle_entries')
        .insert({
          raffle_id: raffleId,
          user_id: userId,
        });

      if (entryError) {
        console.error('Error creating raffle entry:', entryError);
        // Rollback tokens
        if (deduct.newBalance != null) {
          await supabase
            .from('profiles')
            .update({ tokens: deduct.newBalance + RAFFLE_ENTRY_TOKEN_COST })
            .eq('id', userId);
        }
        return { success: false, message: 'Failed to enter raffle' };
      }

      console.log('✅ User entered raffle successfully:', { userId, raffleId });

      return {
        success: true,
        message: 'You have successfully entered the raffle! Good luck!',
        newTokenBalance: deduct.newBalance,
      };
    } catch (error) {
      console.error('Error in enterRaffle:', error);
      return { success: false, message: 'Failed to enter raffle' };
    }
  }

  /**
   * Get past winners
   */
  async getPastWinners(): Promise<Array<{ raffle: Raffle; winner: any }>> {
    try {
      const { data, error } = await supabase
        .from('raffles')
        .select(`
          *,
          winner:profiles!raffles_winner_id_fkey(id, full_name, avatar_url)
        `)
        .eq('status', 'completed')
        .not('winner_id', 'is', null)
        .order('draw_date', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching past winners:', error);
        return [];
      }

      return (data || []).map(d => ({
        raffle: d,
        winner: d.winner
      }));
    } catch (error) {
      console.error('Error in getPastWinners:', error);
      return [];
    }
  }
}

export const raffleService = new RaffleService();

