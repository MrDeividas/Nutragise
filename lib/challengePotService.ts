/**
 * Challenge Pot Service
 * Manages challenge investment pots including:
 * - Creating and managing pots
 * - Adding investments
 * - Tracking daily proof
 * - Calculating forfeitures
 * - Distributing winnings
 */

import { supabase } from './supabase';
import { walletService } from './walletService';
import {
  ChallengePot,
  DailyProofTracking,
  PotStatus,
  ChallengeParticipantWithInvestment,
} from '../types/wallet';

class ChallengePotService {
  /**
   * Create a new challenge pot
   */
  async createPot(
    challengeId: string,
    platformFeePercentage?: number
  ): Promise<ChallengePot> {
    try {
      // Check if pot already exists
      const { data: existingPot } = await supabase
        .from('challenge_pots')
        .select('*')
        .eq('challenge_id', challengeId)
        .single();

      if (existingPot) {
        return existingPot;
      }

      // If no platform fee specified, use default of 30%
      if (platformFeePercentage === undefined) {
        platformFeePercentage = 30.00;
      }

      // Create new pot
      const { data: newPot, error } = await supabase
        .from('challenge_pots')
        .insert({
          challenge_id: challengeId,
          total_amount: 0.00,
          platform_fee_percentage: platformFeePercentage,
          platform_fee_amount: 0.00,
          winners_pot: 0.00,
          status: 'collecting',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating pot:', error);
        throw error;
      }

      if (!newPot) {
        throw new Error('Failed to create pot');
      }

      console.log('✅ Created challenge pot:', { challengeId, platformFeePercentage });
      return newPot;
    } catch (error) {
      console.error('Error in createPot:', error);
      throw error;
    }
  }

  /**
   * Add investment to pot (when user joins challenge)
   */
  async addInvestment(
    challengeId: string,
    userId: string,
    amount: number = 10.00
  ): Promise<ChallengePot> {
    try {
      // Get or create pot
      let pot = await this.createPot(challengeId);

      // Update pot total
      const newTotal = Number(pot.total_amount) + amount;
      const platformFee = newTotal * (Number(pot.platform_fee_percentage) / 100);
      const winnersPot = newTotal - platformFee;

      const { data: updatedPot, error: potError } = await supabase
        .from('challenge_pots')
        .update({
          total_amount: newTotal,
          platform_fee_amount: platformFee,
          winners_pot: winnersPot,
        })
        .eq('id', pot.id)
        .select()
        .single();

      if (potError) {
        console.error('Error updating pot:', potError);
        throw potError;
      }

      console.log('✅ Added investment to pot:', {
        challengeId,
        userId,
        amount,
        newTotal,
      });

      return updatedPot!;
    } catch (error) {
      console.error('Error in addInvestment:', error);
      throw error;
    }
  }

  /**
   * Remove investment from pot (when user leaves challenge before it starts)
   */
  async removeInvestment(
    challengeId: string,
    userId: string,
    amount: number = 10.00
  ): Promise<ChallengePot> {
    try {
      // Get pot
      const { data: pot, error: potError } = await supabase
        .from('challenge_pots')
        .select('*')
        .eq('challenge_id', challengeId)
        .single();

      if (potError || !pot) {
        console.error('Error fetching pot:', potError);
        throw new Error('Pot not found');
      }

      // Calculate new totals (subtract the amount)
      const newTotal = Math.max(0, Number(pot.total_amount) - amount);
      const platformFee = newTotal * (Number(pot.platform_fee_percentage) / 100);
      const winnersPot = newTotal - platformFee;

      const { data: updatedPot, error: updateError } = await supabase
        .from('challenge_pots')
        .update({
          total_amount: newTotal,
          platform_fee_amount: platformFee,
          winners_pot: winnersPot,
        })
        .eq('id', pot.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating pot:', updateError);
        throw updateError;
      }

      console.log('✅ Removed investment from pot:', {
        challengeId,
        userId,
        amount,
        newTotal,
      });

      return updatedPot!;
    } catch (error) {
      console.error('Error in removeInvestment:', error);
      throw error;
    }
  }

  /**
   * Track daily proof submission
   */
  async trackDailyProof(
    challengeId: string,
    userId: string,
    date: string, // Format: YYYY-MM-DD
    hasProof: boolean,
    submissionId?: string
  ): Promise<DailyProofTracking> {
    try {
      // Upsert daily proof tracking
      const { data: tracking, error } = await supabase
        .from('daily_proof_tracking')
        .upsert({
          challenge_id: challengeId,
          user_id: userId,
          date,
          has_proof: hasProof,
          submission_id: submissionId,
          forfeited: false,
          forfeited_amount: 0.00,
        }, {
          onConflict: 'challenge_id,user_id,date',
        })
        .select()
        .single();

      if (error) {
        console.error('Error tracking daily proof:', error);
        throw error;
      }

      console.log('✅ Tracked daily proof:', {
        challengeId,
        userId,
        date,
        hasProof,
      });

      return tracking!;
    } catch (error) {
      console.error('Error in trackDailyProof:', error);
      throw error;
    }
  }

  /**
   * Calculate forfeitures for users who missed proof on a given day
   */
  async calculateForfeitures(
    challengeId: string,
    date: string
  ): Promise<number> {
    try {
      // Get all participants
      const { data: participants, error: participantsError } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('status', 'active');

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        throw participantsError;
      }

      if (!participants || participants.length === 0) {
        return 0;
      }

      // Get proof tracking for this date
      const { data: proofs, error: proofsError } = await supabase
        .from('daily_proof_tracking')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('date', date);

      if (proofsError) {
        console.error('Error fetching proofs:', proofsError);
        throw proofsError;
      }

      // Find users who didn't submit proof
      const proofMap = new Map(proofs?.map(p => [p.user_id, p.has_proof]) || []);
      const usersWhoMissed = participants.filter(p => !proofMap.get(p.user_id));

      if (usersWhoMissed.length === 0) {
        console.log('✅ All participants submitted proof for', date);
        return 0;
      }

      // Calculate forfeiture amount per user
      // For simplicity: each user who misses loses their share proportionally
      const forfeiturePerUser = 10.00 / participants.length;
      let totalForfeited = 0;

      // Mark forfeitures
      for (const user of usersWhoMissed) {
        // Update participant's forfeiture
        const { error: updateError } = await supabase
          .from('challenge_participants')
          .update({
            forfeited_amount: Number(user.forfeited_amount || 0) + forfeiturePerUser,
            days_missed: (user.days_missed || 0) + 1,
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating participant forfeiture:', updateError);
        }

        // Mark proof tracking as forfeited
        await supabase
          .from('daily_proof_tracking')
          .upsert({
            challenge_id: challengeId,
            user_id: user.user_id,
            date,
            has_proof: false,
            forfeited: true,
            forfeited_amount: forfeiturePerUser,
          }, {
            onConflict: 'challenge_id,user_id,date',
          });

        totalForfeited += forfeiturePerUser;
      }

      console.log('✅ Calculated forfeitures:', {
        challengeId,
        date,
        usersWhoMissed: usersWhoMissed.length,
        totalForfeited,
      });

      return totalForfeited;
    } catch (error) {
      console.error('Error in calculateForfeitures:', error);
      return 0;
    }
  }

  /**
   * Distribute pot to winners at challenge end
   */
  async distributePot(challengeId: string): Promise<void> {
    try {
      // Get pot
      const { data: pot, error: potError } = await supabase
        .from('challenge_pots')
        .select('*')
        .eq('challenge_id', challengeId)
        .single();

      if (potError || !pot) {
        console.error('Error fetching pot:', potError);
        throw new Error('Pot not found');
      }

      if (pot.status === 'completed') {
        console.log('⚠️ Pot already distributed');
        return;
      }

      // Get all participants
      const { data: allParticipantsData, error: allParticipantsError } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId);

      if (allParticipantsError) {
        console.error('Error fetching all participants:', allParticipantsError);
        throw allParticipantsError;
      }

      const totalParticipants = allParticipantsData?.length || 0;

      // Get all participants who completed 100%
      const { data: participants, error: participantsError } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('status', 'completed')
        .eq('completion_percentage', 100);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        throw participantsError;
      }

      if (!participants || participants.length === 0) {
        console.log('⚠️ No winners to distribute pot to');
        
        // All funds go to platform as fees
        const totalPot = Number(pot.total_pot);
        if (totalPot > 0) {
          try {
            await walletService.addPlatformFee(totalPot, challengeId);
            console.log('✅ All forfeited funds collected as platform fee:', totalPot);
          } catch (error) {
            console.error('❌ Error collecting forfeited funds:', error);
          }
        }
        
        // Update pot status
        await supabase
          .from('challenge_pots')
          .update({
            status: 'completed',
            distributed_at: new Date().toISOString(),
          })
          .eq('id', pot.id);

        return;
      }

      const winnerCount = participants.length;
      const everyoneWon = winnerCount === totalParticipants;

      let payoutPerWinner: number;
      let platformFeeCollected = 0;

      if (everyoneWon) {
        // Everyone completed - refund investment to each user (no platform fee)
        const { data: challenge } = await supabase
          .from('challenges')
          .select('entry_fee')
          .eq('id', challengeId)
          .single();
        
        payoutPerWinner = challenge?.entry_fee || 0;
        console.log('🎉 Everyone completed! Refunding investments without platform fee.');
      } else {
        // Some users failed - distribute winners pot and collect platform fee from losers
        const winnersPot = Number(pot.winners_pot);
        const platformFee = Number(pot.platform_fee_amount);
        
        payoutPerWinner = winnersPot / winnerCount;
        platformFeeCollected = platformFee;

        // Collect platform fee from forfeited funds
        if (platformFee > 0) {
          try {
            await walletService.addPlatformFee(platformFee, challengeId);
            console.log('✅ Platform fee collected from forfeited funds:', platformFee);
          } catch (error) {
            console.error('❌ Error collecting platform fee:', error);
            // Continue with distribution even if fee collection fails
          }
        }
      }

      // Get all payment intent IDs for this challenge (for tracking)
      const { data: allParticipants } = await supabase
        .from('challenge_participants')
        .select('stripe_payment_intent_id')
        .eq('challenge_id', challengeId)
        .not('stripe_payment_intent_id', 'is', null);

      const paymentIntentIds = allParticipants
        ?.map(p => p.stripe_payment_intent_id)
        .filter(Boolean) || [];

      // Distribute to each winner via Stripe Connect
      for (const participant of participants) {
        try {
          // Transfer winnings via Stripe Connect (adds to wallet, can be upgraded to direct bank transfer)
          const { stripeService } = await import('./stripeService');
          await stripeService.transferChallengeWinnings(
            participant.user_id,
            payoutPerWinner,
            challengeId,
            paymentIntentIds
          );

          // Update participant record
          await supabase
            .from('challenge_participants')
            .update({
              is_winner: true,
              payout_amount: payoutPerWinner,
              payout_status: 'paid',
            })
            .eq('id', participant.id);

          console.log('✅ Paid winner via Stripe Connect:', {
            userId: participant.user_id,
            amount: payoutPerWinner,
          });
        } catch (error) {
          console.error('❌ Error paying winner:', error);
          
          // Mark payout as failed
          await supabase
            .from('challenge_participants')
            .update({
              is_winner: true,
              payout_amount: payoutPerWinner,
              payout_status: 'failed',
            })
            .eq('id', participant.id);
        }
      }

      // Update pot status
      await supabase
        .from('challenge_pots')
        .update({
          status: 'completed',
          distributed_at: new Date().toISOString(),
        })
        .eq('id', pot.id);

      console.log('✅ Pot distribution complete:', {
        challengeId,
        winnerCount: participants.length,
        totalParticipants,
        everyoneWon,
        payoutPerWinner,
        platformFeeCollected,
        totalDistributed: payoutPerWinner * participants.length,
      });
    } catch (error) {
      console.error('Error in distributePot:', error);
      throw error;
    }
  }

  /**
   * Check and distribute completed challenges
   * Call this periodically or on app load to process any completed challenges
   */
  async processCompletedChallenges(): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      // Get all challenges that have ended but pot not yet distributed
      const { data: completedChallenges, error } = await supabase
        .from('challenges')
        .select(`
          id,
          challenge_pots!inner(id, status, distributed_at)
        `)
        .lt('end_date', now)
        .is('challenge_pots.distributed_at', null);

      if (error) {
        console.error('Error fetching completed challenges:', error);
        return;
      }

      if (!completedChallenges || completedChallenges.length === 0) {
        console.log('No completed challenges to process');
        return;
      }

      console.log(`Processing ${completedChallenges.length} completed challenge(s)...`);

      // Process each completed challenge
      for (const challenge of completedChallenges) {
        try {
          await this.distributePot(challenge.id);
        } catch (error) {
          console.error(`Error processing challenge ${challenge.id}:`, error);
          // Continue processing other challenges
        }
      }

      console.log('✅ Completed challenges processed');
    } catch (error) {
      console.error('Error in processCompletedChallenges:', error);
    }
  }

  /**
   * Get pot status for a challenge
   */
  async getPotStatus(challengeId: string): Promise<PotStatus | null> {
    try {
      const { data: pot, error: potError } = await supabase
        .from('challenge_pots')
        .select('*')
        .eq('challenge_id', challengeId)
        .single();

      if (potError || !pot) {
        return null;
      }

      // Get participant count
      const { data: participants, error: participantsError } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', challengeId);

      const participantCount = participants?.length || 0;

      return {
        potId: pot.id,
        challengeId: pot.challenge_id,
        totalAmount: Number(pot.total_amount),
        platformFee: Number(pot.platform_fee_amount),
        winnersPot: Number(pot.winners_pot),
        participantCount,
        status: pot.status,
        distributedAt: pot.distributed_at,
      };
    } catch (error) {
      console.error('Error in getPotStatus:', error);
      return null;
    }
  }

  /**
   * Check if user has submitted proof for a specific date
   */
  async hasSubmittedProof(
    challengeId: string,
    userId: string,
    date: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('daily_proof_tracking')
        .select('has_proof')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      if (error || !data) {
        return false;
      }

      return data.has_proof;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user's proof history for a challenge
   */
  async getUserProofHistory(
    challengeId: string,
    userId: string
  ): Promise<DailyProofTracking[]> {
    try {
      const { data, error } = await supabase
        .from('daily_proof_tracking')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching proof history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserProofHistory:', error);
      return [];
    }
  }
}

export const challengePotService = new ChallengePotService();

