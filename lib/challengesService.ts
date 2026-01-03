import { supabase } from './supabase';
import { apiCache } from './apiCache';
import { walletService } from './walletService';
import { challengePotService } from './challengePotService';
import { stripeService } from './stripeService';
import {
  Challenge,
  ChallengeWithDetails,
  ChallengeParticipant,
  ChallengeSubmission,
  ChallengeRequirement,
  ChallengeProgress,
  CreateChallengeData,
  JoinChallengeData,
  SubmitChallengeProofData,
  isChallengeActive,
  isChallengeUpcoming,
  getChallengeWeekNumber,
  isRecurringChallenge,
  getCurrentWeekForRecurringChallenge,
  getCurrentRecurringPeriod,
} from '../types/challenges';

class ChallengesService {
  /**
   * Get all challenges with optional status filter
   */
  async getChallenges(status?: 'active' | 'upcoming' | 'completed'): Promise<Challenge[]> {
    try {
      // Check cache first
      const cacheKey = apiCache.generateKey('challenges', status || 'all');
      const cached = apiCache.get<Challenge[]>(cacheKey);
      
      if (cached !== null) {
        return cached;
      }

      let query = supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching challenges:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Get participant counts for all challenges in a single batch query
      const challengeIds = data.map(c => c.id);
      const { data: participantCounts, error: countError } = await supabase
        .from('challenge_participants')
        .select('challenge_id')
        .in('challenge_id', challengeIds);

      if (countError) {
        console.error('Error getting participant counts:', countError);
      }

      // Create a map of challenge_id -> count
      const countMap = new Map<string, number>();
      if (participantCounts) {
        participantCounts.forEach((p: any) => {
          const currentCount = countMap.get(p.challenge_id) || 0;
          countMap.set(p.challenge_id, currentCount + 1);
        });
      }

      // Map counts to challenges and include approval_status
      let challenges = (data || []).map((challenge) => ({
        ...challenge,
        participant_count: countMap.get(challenge.id) || 0,
        approval_status: challenge.approval_status || undefined,
      }));

      // Aggressive deduplication: Remove duplicates by title + date + entry_fee
      // Keep only the most recent instance (by created_at or start_date)
      // This handles cases where multiple instances are created for the same day
      const challengeMap = new Map<string, Challenge>();
      const duplicateCount = { found: 0, removed: 0 };
      
      challenges.forEach(challenge => {
        // Normalize date to day level (ignore time)
        const challengeDate = new Date(challenge.start_date);
        challengeDate.setUTCHours(0, 0, 0, 0);
        challengeDate.setUTCMinutes(0);
        challengeDate.setUTCSeconds(0);
        challengeDate.setUTCMilliseconds(0);
        const dateKey = challengeDate.toISOString().split('T')[0];
        
        // Create deduplication key: title + date (day only) + entry_fee
        const dedupKey = `${challenge.title}_${dateKey}_${challenge.entry_fee || 0}`;
        
        const existing = challengeMap.get(dedupKey);
        if (!existing) {
          challengeMap.set(dedupKey, challenge);
        } else {
          duplicateCount.found++;
          // Keep the one with the later created_at or start_date
          const existingDate = new Date(existing.created_at || existing.start_date);
          const currentDate = new Date(challenge.created_at || challenge.start_date);
          if (currentDate > existingDate) {
            duplicateCount.removed++;
            console.log(`🔄 [Deduplication] REMOVING duplicate: "${challenge.title}" (${dateKey}, £${challenge.entry_fee || 0})`);
            console.log(`   ❌ Removing ID: ${existing.id} (created: ${existing.created_at})`);
            console.log(`   ✅ Keeping ID: ${challenge.id} (created: ${challenge.created_at})`);
            challengeMap.set(dedupKey, challenge);
          } else {
            duplicateCount.removed++;
            console.log(`🔄 [Deduplication] REMOVING duplicate: "${challenge.title}" (${dateKey}, £${challenge.entry_fee || 0})`);
            console.log(`   ❌ Removing ID: ${challenge.id} (created: ${challenge.created_at})`);
            console.log(`   ✅ Keeping ID: ${existing.id} (created: ${existing.created_at})`);
          }
        }
      });
      challenges = Array.from(challengeMap.values());
      
      if (duplicateCount.found > 0) {
        console.log(`⚠️ [Deduplication] Found ${duplicateCount.found} duplicate(s), removed ${duplicateCount.removed}`);
      }
      console.log(`✅ [Deduplication] Filtered ${data.length} challenges down to ${challenges.length} unique challenges`);

      // Filter recurring challenges to only show current period's instances
      const now = new Date();
      const filteredChallenges: Challenge[] = [];
      const recurringTitles = new Set<string>();
      const seenChallengeIds = new Set<string>(); // Track by ID to prevent duplicates

      for (const challenge of challenges) {
        // Skip if we've already seen this challenge ID (duplicate prevention)
        if (seenChallengeIds.has(challenge.id)) {
          // Duplicate challenge IDs are silently skipped (filtering is working correctly)
          continue;
        }
        seenChallengeIds.add(challenge.id);
        
        if (challenge.is_recurring) {
          const schedule = challenge.recurring_schedule || 'weekly';
          const challengeStart = new Date(challenge.start_date);
          const challengeEnd = new Date(challenge.end_date);
          
          // If end date is set to midnight (00:00), it's actually the end of the previous day
          // So we need to set it to the end of that day (23:59:59.999)
          if (challengeEnd.getUTCHours() === 0 && challengeEnd.getUTCMinutes() === 0 && challengeEnd.getUTCSeconds() === 0) {
            challengeEnd.setUTCHours(23, 59, 59, 999);
          }
          
          if (schedule === 'daily') {
            // For daily recurring challenges, show current day's instance
            const today = new Date(now);
            today.setUTCHours(0, 0, 0, 0);
            const challengeDay = new Date(challengeStart);
            challengeDay.setUTCHours(0, 0, 0, 0);
            
            const isToday = challengeDay.getTime() === today.getTime();
            const isTomorrow = challengeDay.getTime() === today.getTime() + 24 * 60 * 60 * 1000;
            
            // Show today's or tomorrow's instance
            if (isToday || isTomorrow) {
              // Auto-activate if start time has passed
              if (challenge.status === 'upcoming' && now >= challengeStart) {
                await supabase
                  .from('challenges')
                  .update({ status: 'active' })
                  .eq('id', challenge.id);
                challenge.status = 'active';
              }
              
              // Only add if we haven't already added a challenge with this title for today
              // Use a more specific key: title + date + entry_fee to distinguish free vs paid
              const key = `${challenge.title}_${challengeDay.toISOString().split('T')[0]}_${challenge.entry_fee || 0}`;
              if (!recurringTitles.has(key)) {
                filteredChallenges.push(challenge);
                recurringTitles.add(key);
              }
              // Duplicate daily challenges are silently skipped (filtering is working correctly)
            }
          } else {
            // For weekly recurring challenges, show current week's instance
            const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            
            const isActive = (now >= challengeStart && now <= challengeEnd);
            const isUpcoming = (now < challengeStart && challengeStart <= oneWeekFromNow);
            const isRecentlyEnded = (now > challengeEnd && now <= oneWeekFromNow);
            
            // Show if active, upcoming, or recently ended (to bridge gaps)
            if (isActive || isUpcoming || isRecentlyEnded) {
              // Only add if we haven't already added a challenge with this title
              // Use title + entry_fee to distinguish free vs paid versions
              const key = `${challenge.title}_${challenge.entry_fee || 0}`;
              if (!recurringTitles.has(key)) {
                filteredChallenges.push(challenge);
                recurringTitles.add(key);
              }
              // Duplicate weekly challenges are silently skipped (filtering is working correctly)
            }
          }
        } else {
          // Non-recurring challenges are added as normal
          filteredChallenges.push(challenge);
        }
      }

      // Cache the result for 3 minutes
      apiCache.set(cacheKey, filteredChallenges, 3 * 60 * 1000);
      
      return filteredChallenges;
    } catch (error) {
      console.error('Error in getChallenges:', error);
      throw error;
    }
  }

  /**
   * Get a single challenge by ID with full details
   */
  async getChallengeById(id: string): Promise<ChallengeWithDetails | null> {
    try {
      // Get challenge, requirements, and participants in parallel
      const [challengeResult, requirementsResult, participantsResult] = await Promise.all([
        supabase
          .from('challenges')
          .select('*')
          .eq('id', id)
          .single(),
        supabase
          .from('challenge_requirements')
          .select('*')
          .eq('challenge_id', id)
          .order('requirement_order'),
        supabase
          .from('challenge_participants')
          .select('*')
          .eq('challenge_id', id)
      ]);

      if (challengeResult.error) {
        console.error('Error fetching challenge:', challengeResult.error);
        throw challengeResult.error;
      }

      const challenge = challengeResult.data;
      if (!challenge) return null;

      const requirements = requirementsResult.data || [];
      const participants = participantsResult.data || [];

      // Get user profiles for participants and creator in a single query
      const userIds = [...new Set([
        ...participants.map(p => p.user_id),
        challenge.created_by
      ].filter(Boolean))];

      let profilesMap = new Map();
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, display_name')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        } else if (profiles) {
          profiles.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });
        }
      }

      // Combine participants with their profile data
      const participantsWithProfiles = participants.map(participant => ({
        ...participant,
        user: profilesMap.get(participant.user_id)
      }));

      const creator = profilesMap.get(challenge.created_by);

      return {
        ...challenge,
        requirements: requirements || [],
        participants: participantsWithProfiles || [],
        user_submissions: [], // Will be populated separately if needed
        creator: creator || undefined,
        participant_count: participantsWithProfiles?.length || 0,
      };
    } catch (error) {
      console.error('Error in getChallengeById:', error);
      throw error;
    }
  }

  /**
   * Initiate challenge join using wallet balance
   * Deducts from wallet and transfers to Stripe escrow (Platform account)
   */
  async initiateChallengeJoinWithWallet(
    challengeId: string,
    userId: string,
    entryFee: number
  ): Promise<{
    paymentIntentId: string;
    clientSecret: string;
  }> {
    try {
      console.log(`🔍 [initiateChallengeJoinWithWallet] Using wallet balance for challenge ${challengeId}, user ${userId}, amount: £${entryFee}`);
      
      // Transfer from wallet to Stripe escrow
      // This handles both wallet deduction and Stripe Payment Intent creation/confirmation
      // Funds are moved from user wallet DB to Stripe Platform account (conceptually escrow)
      const { paymentIntentId } = await stripeService.transferWalletToEscrow(
        userId,
        challengeId,
        entryFee
      );
      
      console.log(`✅ [initiateChallengeJoinWithWallet] Funds transferred to escrow: ${paymentIntentId}`);
      
      return {
        paymentIntentId,
        clientSecret: '', // Not needed for wallet payment (already confirmed)
      };
    } catch (error) {
      console.error('Error initiating challenge join with wallet:', error);
      throw error;
    }
  }

  /**
   * Initiate challenge join - creates Stripe Payment Intent for escrow
   * Returns payment intent details for UI to show Stripe Payment Sheet
   * Includes Stripe fee calculation (user covers fees)
   */
  async initiateChallengeJoin(challengeId: string, userId: string): Promise<{
    paymentIntentId: string;
    clientSecret: string;
    entryFee: number; // Original entry fee (before Stripe fee)
    stripeFee: number; // Stripe processing fee
    totalAmount: number; // Total amount user pays (entryFee + stripeFee)
  }> {
    try {
      console.log(`🔍 [initiateChallengeJoin] Initiating join for challenge ${challengeId}, user ${userId}`);
      
      // Get challenge details
      const { data: challenge } = await supabase
        .from('challenges')
        .select('*, status, start_date, max_participants, is_recurring, title, recurring_schedule, entry_fee')
        .eq('id', challengeId)
        .single();

      if (!challenge) {
        throw new Error('Challenge not found');
      }

      // Check if already joined
      const { data: existing } = await supabase
        .from('challenge_participants')
        .select('id, status')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .single();

      if (existing && existing.status === 'active') {
        throw new Error('Already joined this challenge');
      }

      if (challenge.status !== 'active' && challenge.status !== 'upcoming') {
        throw new Error('Challenge is not open for joining');
      }

      const entryFee = challenge.entry_fee || 0;

      if (entryFee > 0) {
        // Create Stripe Payment Intent for escrow (includes Stripe fee)
        const { clientSecret, paymentIntentId, originalAmount, stripeFee, totalAmount } = 
          await stripeService.createChallengePaymentIntent(
            entryFee,
            userId,
            challengeId
          );

        console.log(`✅ [initiateChallengeJoin] Payment intent created: ${paymentIntentId}`);
        console.log(`💰 [initiateChallengeJoin] Fee breakdown: Entry £${entryFee.toFixed(2)} + Fee £${(stripeFee || 0).toFixed(2)} = Total £${(totalAmount || entryFee).toFixed(2)}`);

        return {
          paymentIntentId,
          clientSecret,
          entryFee: originalAmount || entryFee,
          stripeFee: stripeFee || 0,
          totalAmount: totalAmount || entryFee,
        };
      } else {
        // Free challenge - no payment needed
        // Create participant record immediately
        await this.completeChallengeJoin(challengeId, userId, null);
        return {
          paymentIntentId: '',
          clientSecret: '',
          entryFee: 0,
        };
      }
    } catch (error) {
      console.error('Error initiating challenge join:', error);
      throw error;
    }
  }

  /**
   * Complete challenge join after payment succeeds
   * Updates participant record with payment intent ID
   */
  async completeChallengeJoin(
    challengeId: string,
    userId: string,
    paymentIntentId: string | null
  ): Promise<boolean> {
    try {
      console.log(`🔍 [completeChallengeJoin] Completing join for challenge ${challengeId}, user ${userId}, payment: ${paymentIntentId}`);
      
      // Get challenge details
      const { data: challenge } = await supabase
        .from('challenges')
        .select('entry_fee')
        .eq('id', challengeId)
        .single();

      if (!challenge) {
        throw new Error('Challenge not found');
      }

      const entryFee = challenge.entry_fee || 0;

      // Create or update participant record
      const { data: existing } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('challenge_participants')
          .update({
            status: 'active',
            payment_status: entryFee > 0 && paymentIntentId ? 'paid' : 'pending',
            investment_amount: entryFee,
            stripe_payment_intent_id: paymentIntentId,
          })
          .eq('id', existing.id);

        if (error) {
          throw error;
        }
      } else {
        // Create new record
        const { error } = await supabase
          .from('challenge_participants')
          .insert({
            challenge_id: challengeId,
            user_id: userId,
            status: 'active',
            payment_status: entryFee > 0 && paymentIntentId ? 'paid' : 'pending',
            investment_amount: entryFee,
            stripe_payment_intent_id: paymentIntentId,
          });

        if (error) {
          throw error;
        }
      }

      // Update challenge pot (for tracking, funds are in Stripe escrow)
      if (entryFee > 0) {
        try {
          await challengePotService.addInvestment(challengeId, userId, entryFee);
          console.log(`✅ [completeChallengeJoin] Investment tracked in pot (funds in Stripe escrow)`);
        } catch (potError) {
          console.error(`❌ [completeChallengeJoin] Error updating pot (non-critical):`, potError);
        }
      }

      // Invalidate challenge cache
      apiCache.delete(apiCache.generateKey('challenges', 'all'));
      apiCache.delete(apiCache.generateKey('challenges', 'active'));
      apiCache.delete(apiCache.generateKey('challenges', 'upcoming'));

      console.log(`✅ [completeChallengeJoin] Challenge join completed`);
      return true;
    } catch (error) {
      console.error('Error completing challenge join:', error);
      throw error;
    }
  }

  /**
   * Join a challenge (legacy method - now uses Stripe Connect escrow)
   * @deprecated Use initiateChallengeJoin + completeChallengeJoin instead
   */
  async joinChallenge(challengeId: string, userId: string): Promise<boolean> {
    try {
      console.log(`🔍 [joinChallenge] Attempting to join challenge ${challengeId} for user ${userId}`);
      
      // Get challenge details first
      const { data: challenge } = await supabase
        .from('challenges')
        .select('*, status, start_date, max_participants, is_recurring, title, recurring_schedule')
        .eq('id', challengeId)
        .single();

      if (!challenge) {
        console.error(`❌ [joinChallenge] Challenge not found: ${challengeId}`);
        throw new Error('Challenge not found');
      }

      console.log(`🔍 [joinChallenge] Challenge found: "${challenge.title}" (status: ${challenge.status}, entry_fee: ${challenge.entry_fee})`);

      // Check if user is already participating in THIS SPECIFIC challenge instance
      // For both recurring and non-recurring challenges, we check the specific instance
      const { data: existing } = await supabase
        .from('challenge_participants')
        .select('id, status')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        // User is already in this specific challenge instance
        if (existing.status === 'active') {
          console.log('⚠️ User already joined this challenge instance');
          return false; // Already joined this instance
        }
        // If status is not 'active' (e.g., 'left', 'failed'), allow them to rejoin
      }

      if (challenge.status !== 'active' && challenge.status !== 'upcoming') {
        throw new Error('Challenge is not open for joining');
      }

      // Check participant limit
      if (challenge.max_participants) {
        const { count } = await supabase
          .from('challenge_participants')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', challengeId);

        if (count && count >= challenge.max_participants) {
          throw new Error('Challenge is full');
        }
      }

      const entryFee = challenge.entry_fee || 0;

      // For challenges with entry fee, payment is handled via Stripe Connect escrow
      // The payment intent is created and user pays via Stripe Payment Sheet
      // This function just creates the participant record - payment happens in the UI
      let stripePaymentIntentId: string | null = null;

      if (entryFee > 0) {
        console.log(`💰 [joinChallenge] Challenge requires payment: £${entryFee}`);
        console.log(`💡 [joinChallenge] Payment will be processed via Stripe Connect escrow`);
        // Note: Payment Intent creation and payment happens in the UI (ChallengeDetailScreen)
        // This function is called after payment succeeds
      }

      console.log(`📝 [joinChallenge] Creating participant record...`);
      const { data: participant, error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: userId,
          status: 'active',
          payment_status: entryFee > 0 ? 'pending' : 'pending', // Will be updated when payment succeeds
          investment_amount: entryFee,
          stripe_payment_intent_id: stripePaymentIntentId, // Will be set when payment intent is created
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [joinChallenge] Error creating participant record:', error);
        throw error;
      }

      // Update challenge pot (for tracking, but funds are in Stripe escrow)
      if (entryFee > 0) {
        try {
          await challengePotService.addInvestment(challengeId, userId, entryFee);
          console.log(`✅ [joinChallenge] Investment tracked in challenge pot (funds in Stripe escrow)`);
        } catch (potError) {
          console.error(`❌ [joinChallenge] Error updating pot (non-critical):`, potError);
          // Non-critical error, continue
        }
      }

      console.log(`✅ [joinChallenge] Successfully joined challenge ${challengeId}`);

      // Invalidate challenge cache
      apiCache.delete(apiCache.generateKey('challenges', 'all'));
      apiCache.delete(apiCache.generateKey('challenges', 'active'));
      apiCache.delete(apiCache.generateKey('challenges', 'upcoming'));

      return true;
    } catch (error) {
      console.error('Error in joinChallenge:', error);
      throw error;
    }
  }

  /**
   * Leave a challenge (only before it starts)
   */
  async leaveChallenge(challengeId: string, userId: string): Promise<boolean> {
    try {
      const { data: challenge } = await supabase
        .from('challenges')
        .select('start_date, status, entry_fee')
        .eq('id', challengeId)
        .single();

      if (!challenge) {
        throw new Error('Challenge not found');
      }

      // Only allow leaving if challenge hasn't started yet
      const now = new Date();
      const startDate = new Date(challenge.start_date);
      
      if (now >= startDate) {
        throw new Error('Cannot leave challenge after it has started');
      }

      const entryFee = challenge.entry_fee || 0;

      // Get participant record to find payment method
      const { data: participant } = await supabase
        .from('challenge_participants')
        .select('stripe_payment_intent_id')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .single();

      // Check if payment was made from wallet or card
      // We'll check the Payment Intent metadata to see if paidFromWallet=true
      let paidFromWallet = false;
      if (participant?.stripe_payment_intent_id) {
        try {
          // In a real implementation, you'd fetch the Payment Intent from Stripe
          // For now, we'll check if the Payment Intent amount was $0 (wallet payment)
          // OR store a flag in the participant record
          // For simplicity, if entryFee > 0 and we have a payment intent, assume card payment
          // If no payment intent but entryFee > 0, assume wallet payment (legacy)
          paidFromWallet = !participant.stripe_payment_intent_id || entryFee === 0;
        } catch (error) {
          console.error('Error checking payment method:', error);
        }
      }

      // If challenge has entry fee, refund appropriately
      if (entryFee > 0) {
        try {
          // Refund to wallet logic:
          // Regardless of original payment method (wallet or card), we refund to the user's App Wallet.
          // The funds remain in our Stripe Platform Account (escrow), but the user gets credit in our DB.
          console.log(`💰 [leaveChallenge] Refunding to wallet: £${entryFee}`);
          
          // 1. Credit the user's wallet in DB
          await walletService.refundChallengePayment(userId, entryFee, challengeId);
          
          // 2. Remove the investment from the challenge pot
          await challengePotService.removeInvestment(challengeId, userId, entryFee);
          
          console.log('✅ Refunded challenge payment to wallet:', { 
            userId, 
            challengeId, 
            entryFee
          });
          
          // Note: We do NOT call stripeService.refundChallengePayment() anymore.
          // That would trigger a refund to the card. We want to keep funds in the system (wallet).
          
        } catch (refundError) {
          console.error('❌ Error refunding challenge payment:', refundError);
          // Continue with leaving even if refund fails (log the error)
        }
      }

      // Remove participant record
      const { error } = await supabase
        .from('challenge_participants')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error leaving challenge:', error);
        throw error;
      }

      // Invalidate challenge cache
      apiCache.delete(apiCache.generateKey('challenges', 'all'));
      apiCache.delete(apiCache.generateKey('challenges', 'active'));
      apiCache.delete(apiCache.generateKey('challenges', 'upcoming'));

      console.log('✅ User left challenge:', { userId, challengeId, refunded: entryFee > 0 });
      return true;
    } catch (error) {
      console.error('Error in leaveChallenge:', error);
      throw error;
    }
  }

  /**
   * Get user's active challenges (including completed ones that are still within challenge period)
   */
  async getUserChallenges(userId: string): Promise<Challenge[]> {
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select(`
          challenge:challenges!inner(*)
        `)
        .eq('user_id', userId)
        .in('status', ['active', 'completed']);

      if (error) {
        console.error('Error fetching user challenges:', error);
        throw error;
      }

      const challenges = data?.map(item => item.challenge) || [];
      
      if (challenges.length === 0) {
        return [];
      }

      // Get participant counts for all challenges in a single batch query
      const challengeIds = challenges.map(c => c.id);
      const { data: participantCounts, error: countError } = await supabase
        .from('challenge_participants')
        .select('challenge_id')
        .in('challenge_id', challengeIds);

      if (countError) {
        console.error('Error getting participant counts:', countError);
      }

      // Create a map of challenge_id -> count
      const countMap = new Map<string, number>();
      if (participantCounts) {
        participantCounts.forEach((p: any) => {
          const current = countMap.get(p.challenge_id) || 0;
          countMap.set(p.challenge_id, current + 1);
        });
      }

      // Add participant_count to each challenge
      return challenges.map(challenge => ({
        ...challenge,
        participant_count: countMap.get(challenge.id) || 0,
      }));
    } catch (error) {
      console.error('Error in getUserChallenges:', error);
      throw error;
    }
  }

  /**
   * Submit proof for a challenge
   */
  async submitChallengeProof(
    challengeId: string,
    userId: string,
    photoUrl: string,
    weekNumber: number,
    submissionNotes?: string
  ): Promise<boolean> {
    try {
      // Get challenge to check start date
      const { data: challenge } = await supabase
        .from('challenges')
        .select('start_date, end_date')
        .eq('id', challengeId)
        .single();

      if (!challenge) {
        throw new Error('Challenge not found');
      }

      // Check if challenge has started
      const now = new Date();
      const startDate = new Date(challenge.start_date);
      
      if (now < startDate) {
        throw new Error('This challenge has not started yet. You cannot submit photos until the challenge begins.');
      }

      // Verify user is participating in the challenge
      const { data: participation } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .single();

      if (!participation) {
        throw new Error('You are not participating in this challenge');
      }

      // Get challenge requirements to check submission limits
      const { data: requirements } = await supabase
        .from('challenge_requirements')
        .select('max_submissions_per_period, frequency')
        .eq('challenge_id', challengeId)
        .single();

      // Check submission limits
      if (requirements?.max_submissions_per_period) {
        const maxSubmissions = requirements.max_submissions_per_period;
        
        // Count existing submissions for this period
        let submissionCountQuery = supabase
          .from('challenge_submissions')
          .select('id', { count: 'exact' })
          .eq('challenge_id', challengeId)
          .eq('user_id', userId);

        if (requirements.frequency === 'daily') {
          // For daily challenges, count submissions for the current day
          const today = new Date();
          const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
          
          submissionCountQuery = submissionCountQuery
            .gte('submitted_at', startOfDay.toISOString())
            .lt('submitted_at', endOfDay.toISOString());
        } else {
          // For weekly challenges, count submissions for the current week
          submissionCountQuery = submissionCountQuery.eq('week_number', weekNumber);
        }

        const { count: submissionCount } = await submissionCountQuery;

        if (submissionCount && submissionCount >= maxSubmissions) {
          const periodText = requirements.frequency === 'daily' ? 'today' : 'this week';
          throw new Error(`You have already submitted the maximum number of photos (${maxSubmissions}) for ${periodText}`);
        }
      }

      // Check if submission already exists for this week/day
      let existingSubmissionQuery = supabase
        .from('challenge_submissions')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

      if (requirements?.frequency === 'daily') {
        // For daily challenges, check if submission exists for today
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        existingSubmissionQuery = existingSubmissionQuery
          .gte('submitted_at', startOfDay.toISOString())
          .lt('submitted_at', endOfDay.toISOString());
      } else {
        // For weekly challenges, check by week number
        existingSubmissionQuery = existingSubmissionQuery.eq('week_number', weekNumber);
      }

      const { data: existingSubmission } = await existingSubmissionQuery.single();

      let submissionId: string | undefined;

      if (existingSubmission) {
        // Update existing submission
        const { error } = await supabase
          .from('challenge_submissions')
          .update({
            photo_url: photoUrl,
            submission_notes: submissionNotes,
            verification_status: 'pending',
          })
          .eq('id', existingSubmission.id);

        if (error) {
          console.error('Error updating submission:', error);
          throw error;
        }
        submissionId = existingSubmission.id;
      } else {
        // Create new submission
        const { data: newSubmission, error } = await supabase
          .from('challenge_submissions')
          .insert({
            challenge_id: challengeId,
            user_id: userId,
            photo_url: photoUrl,
            week_number: weekNumber,
            submission_notes: submissionNotes,
            verification_status: 'pending',
          })
          .select('id')
          .single();

        if (error) {
          console.error('Error creating submission:', error);
          throw error;
        }
        submissionId = newSubmission?.id;
      }

      // Track daily proof for pot system (if challenge has entry fee)
      const today = new Date();
      const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      try {
        await challengePotService.trackDailyProof(
          challengeId,
          userId,
          dateString,
          true,
          submissionId
        );
      } catch (proofError) {
        console.error('Error tracking daily proof:', proofError);
        // Don't fail the submission if proof tracking fails
      }

      // Update user's completion percentage
      await this.updateUserCompletionPercentage(challengeId, userId);

      return true;
    } catch (error) {
      console.error('Error in submitChallengeProof:', error);
      throw error;
    }
  }

  /**
   * Get user's submissions for a challenge
   */
  async getChallengeSubmissions(challengeId: string, userId: string): Promise<ChallengeSubmission[]> {
    try {
      const { data, error } = await supabase
        .from('challenge_submissions')
        .select('*')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .order('week_number');

      if (error) {
        console.error('Error fetching submissions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getChallengeSubmissions:', error);
      throw error;
    }
  }

  /**
   * Get user's progress for a challenge
   */
  async getChallengeProgress(challengeId: string, userId: string): Promise<ChallengeProgress | null> {
    try {
      const { data: challenge } = await supabase
        .from('challenges')
        .select('duration_weeks, end_date')
        .eq('id', challengeId)
        .single();

      if (!challenge) return null;

      const submissions = await this.getChallengeSubmissions(challengeId, userId);
      const completedWeeks = new Set(submissions.map(s => s.week_number)).size;
      const completionPercentage = (completedWeeks / challenge.duration_weeks) * 100;

      const now = new Date();
      const endDate = new Date(challenge.end_date);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const submissionsByWeek = submissions.reduce((acc, submission) => {
        if (!acc[submission.week_number]) {
          acc[submission.week_number] = [];
        }
        acc[submission.week_number].push(submission);
        return acc;
      }, {} as { [week: number]: ChallengeSubmission[] });

      return {
        challenge_id: challengeId,
        user_id: userId,
        total_weeks: challenge.duration_weeks,
        completed_weeks: completedWeeks,
        completion_percentage: completionPercentage,
        submissions_by_week: submissionsByWeek,
        is_on_track: completionPercentage >= (completedWeeks / challenge.duration_weeks) * 100,
        days_remaining: Math.max(0, daysRemaining),
      };
    } catch (error) {
      console.error('Error in getChallengeProgress:', error);
      throw error;
    }
  }

  /**
   * Update user's completion percentage for a challenge
   */
  private async updateUserCompletionPercentage(challengeId: string, userId: string): Promise<void> {
    try {
      const progress = await this.getChallengeProgress(challengeId, userId);
      if (!progress) return;

      // Prepare update data
      const updateData: any = { 
        completion_percentage: progress.completion_percentage 
      };

      // If 100% complete, also update status to 'completed'
      if (progress.completion_percentage >= 100) {
        updateData.status = 'completed';
      }

      const { error } = await supabase
        .from('challenge_participants')
        .update(updateData)
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating completion percentage:', error);
      }
    } catch (error) {
      console.error('Error in updateUserCompletionPercentage:', error);
    }
  }

  /**
   * Check if user is participating in a challenge
   * Checks if user is actively participating in THIS SPECIFIC challenge instance
   */
  async isUserParticipating(challengeId: string, userId: string): Promise<boolean> {
    try {
      // First, get the challenge to check if it's recurring
      const { data: challenge } = await supabase
        .from('challenges')
        .select('is_recurring, start_date, end_date, title, recurring_schedule')
        .eq('id', challengeId)
        .single();

      if (!challenge) {
        console.log(`🔍 [isUserParticipating] Challenge not found: ${challengeId}`);
        return false;
      }

      console.log(`🔍 [isUserParticipating] Checking participation for "${challenge.title}" (ID: ${challengeId}, is_recurring: ${challenge.is_recurring})`);

      // Always check THIS SPECIFIC challenge instance, not other instances
      // This ensures that if a user leaves a challenge, they're no longer shown as "joined"
      const { data: participation, error } = await supabase
          .from('challenge_participants')
        .select('id, status')
          .eq('challenge_id', challengeId)
          .eq('user_id', userId)
          .single();

      if (error) {
        // If no record found, user is not participating (they may have left or never joined)
        if (error.code === 'PGRST116') {
          console.log(`❌ [isUserParticipating] User is NOT participating in challenge "${challenge.title}" (ID: ${challengeId}) - no record found`);
          return false;
        }
        console.error('❌ [isUserParticipating] Error checking participation:', error);
          return false;
        }

      // Return true if participation exists AND status is 'active' or 'completed'
      // Status can be 'active', 'completed', 'failed', or 'left' - we want 'active' and 'completed'
      const isParticipating = !!participation && (participation.status === 'active' || participation.status === 'completed');
      
      if (isParticipating) {
        console.log(`✅ [isUserParticipating] User IS participating in "${challenge.title}" (ID: ${challengeId}) - status: ${participation.status}`);
      } else {
        console.log(`❌ [isUserParticipating] User is NOT participating in "${challenge.title}" (ID: ${challengeId}) - status: ${participation?.status || 'not found'}`);
      }

      return isParticipating;
    } catch (error) {
      console.error('❌ [isUserParticipating] Error:', error);
      return false;
    }
  }

  /**
   * Get challenge participant count
   */
  async getChallengeParticipantCount(challengeId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('challenge_participants')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', challengeId);

      if (error) {
        console.error('Error getting participant count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getChallengeParticipantCount:', error);
      return 0;
    }
  }

  /**
   * Get all participants for a specific challenge with their profile info
   */
  async getChallengeParticipants(challengeId: string): Promise<ChallengeParticipant[]> {
    try {
      // Get participants
      const { data: participants, error: participantsError } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        return [];
      }

      if (!participants || participants.length === 0) {
        return [];
      }

      // Get user profiles for participants
      const userIds = participants.map(p => p.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, display_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching participant profiles:', profilesError);
      }

      // Combine participants with their profile data
      const participantsWithProfiles = participants.map(participant => ({
        ...participant,
        user: profiles?.find(profile => profile.id === participant.user_id)
      }));

      return participantsWithProfiles;
    } catch (error) {
      console.error('Error in getChallengeParticipants:', error);
      return [];
    }
  }

  /**
   * Handle recurring challenge logic - create new instances for recurring challenges
   */
  async handleRecurringChallenges(): Promise<void> {
    try {
      // Get all recurring challenges (including those without next_recurrence set)
      const { data: recurringChallenges, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_recurring', true)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching recurring challenges:', error);
        return;
      }

      const now = new Date();

      for (const challenge of recurringChallenges || []) {
        const schedule = challenge.recurring_schedule || 'weekly'; // Default to weekly for backwards compatibility
        
        if (schedule === 'daily') {
          await this.handleDailyRecurringChallenge(challenge, now);
        } else {
          // Weekly recurring logic (existing)
          await this.handleWeeklyRecurringChallenge(challenge, now);
        }
      }
    } catch (error) {
      console.error('Error handling recurring challenges:', error);
    }
  }

  /**
   * Handle daily recurring challenge - create new instance each day
   */
  private async handleDailyRecurringChallenge(challenge: Challenge, now: Date): Promise<void> {
    try {
      const endDate = new Date(challenge.end_date);
      const startDate = new Date(challenge.start_date);
      
      // For daily challenges, create next day's instance if current has ended or is ending soon
      // Daily challenges start at midnight and end at midnight the next day
      const today = new Date(now);
      today.setUTCHours(0, 0, 0, 0);
      
      // Today's challenge starts at midnight UTC (00:00)
      const todayStart = new Date(today);
      todayStart.setUTCHours(0, 0, 0, 0); // Midnight UTC
      
      // Today's challenge ends at midnight UTC tomorrow (effectively end of day)
      const todayEnd = new Date(today);
      todayEnd.setUTCDate(today.getUTCDate() + 1);
      todayEnd.setUTCHours(0, 0, 0, 0); // Midnight UTC next day
      
      // Next day's challenge starts at midnight UTC
      const nextDayStart = new Date(today);
      nextDayStart.setUTCDate(today.getUTCDate() + 1);
      nextDayStart.setUTCHours(0, 0, 0, 0); // Midnight UTC next day
      
      // Next day's challenge ends at midnight UTC (day after)
      const nextDayEnd = new Date(today);
      nextDayEnd.setUTCDate(today.getUTCDate() + 2);
      nextDayEnd.setUTCHours(0, 0, 0, 0); // Midnight UTC day after next
      
      // Check if today's instance exists (handle multiple results)
      const todayStartStr = todayStart.toISOString().split('T')[0]; // YYYY-MM-DD
      const { data: todayChallenges } = await supabase
        .from('challenges')
        .select('id, status, entry_fee')
        .eq('title', challenge.title)
        .eq('is_recurring', true)
        .gte('start_date', todayStart.toISOString())
        .lt('start_date', nextDayStart.toISOString());
      
      // Filter to match entry_fee as well (to distinguish free vs paid versions)
      const matchingTodayChallenges = (todayChallenges || []).filter(
        c => (c.entry_fee || 0) === (challenge.entry_fee || 0)
      );
      
      // If multiple exist, log and keep only the first one (we'll deduplicate in getChallenges)
      if (matchingTodayChallenges.length > 1) {
        console.warn(`⚠️ Multiple Daily Smile Challenge instances found for today: ${matchingTodayChallenges.length} instances`);
      }
      
      const todayChallenge = matchingTodayChallenges[0];
      
      // If today's instance doesn't exist and we're still in today, create it
      if (!todayChallenge && now < todayEnd) {
        await this.createDailyRecurringInstance(challenge, todayStart, todayEnd);
      }
      
      // Auto-activate today's challenge if it exists (it starts at midnight, so it's immediately active)
      if (todayChallenge && todayChallenge.status === 'upcoming' && now >= todayStart) {
        await supabase
          .from('challenges')
          .update({ status: 'active' })
          .eq('id', todayChallenge.id);
      }
      
      // Check if we need to create tomorrow's instance
      // Create if current challenge has ended (past midnight tonight)
      const shouldCreateNext = now >= endDate;
      
      if (shouldCreateNext) {
        // Check if tomorrow's challenge already exists (handle multiple results)
        const { data: existingChallenges } = await supabase
          .from('challenges')
          .select('id, entry_fee')
          .eq('title', challenge.title)
          .eq('is_recurring', true)
          .gte('start_date', nextDayStart.toISOString())
          .lt('start_date', new Date(nextDayStart.getTime() + 24 * 60 * 60 * 1000).toISOString());

        // Filter to match entry_fee
        const matchingExisting = (existingChallenges || []).filter(
          c => (c.entry_fee || 0) === (challenge.entry_fee || 0)
        );

        // Only create if no matching challenge exists for tomorrow
        if (matchingExisting.length === 0) {
          await this.createDailyRecurringInstance(challenge, nextDayStart, nextDayEnd);
        } else if (matchingExisting.length > 1) {
          console.warn(`⚠️ Multiple Daily Smile Challenge instances found for tomorrow: ${matchingExisting.length} instances`);
        }
      }
    } catch (error) {
      console.error('Error handling daily recurring challenge:', error);
    }
  }

  /**
   * Handle weekly recurring challenge - create new instance each week
   */
  private async handleWeeklyRecurringChallenge(challenge: Challenge, now: Date): Promise<void> {
    try {
      const endDate = new Date(challenge.end_date);
      
      // Simple: next Monday after the end date
      // end_date is Sunday 23:59:59, so next day is Monday
      const nextWeekStart = new Date(endDate);
      nextWeekStart.setDate(endDate.getDate() + 1); // Move to Monday (next day after Sunday)
      nextWeekStart.setUTCHours(0, 1, 0, 0);
      
      // End is 6 days later (Sunday)
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
      nextWeekEnd.setUTCHours(23, 59, 59, 999);
      
      // Check if it's time to create the next instance
      // Create if:
      // 1. The current instance has ended OR
      // 2. It's within 7 days of the next instance starting
      const shouldCreate = now >= endDate || (nextWeekStart.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000);
      
      if (shouldCreate) {
        // Check if next week's challenge already exists
        // IMPORTANT: Filter by entry_fee to distinguish free vs paid versions
        // Also check all statuses, not just active, to catch any existing instances
        const { data: existingChallenges, error: checkError } = await supabase
          .from('challenges')
          .select('id, entry_fee, status')
          .eq('title', challenge.title)
          .eq('is_recurring', true)
          .eq('entry_fee', challenge.entry_fee || 0) // Match entry_fee to prevent duplicates
          .gte('start_date', nextWeekStart.toISOString())
          .lte('end_date', nextWeekEnd.toISOString());

        // Only create if no matching challenge exists for next week
        // Handle the case where multiple might exist (shouldn't happen, but be safe)
        const matchingChallenges = (existingChallenges || []).filter(
          c => (c.entry_fee || 0) === (challenge.entry_fee || 0)
        );

        if (matchingChallenges.length === 0) {
          await this.createRecurringInstance(challenge);
        } else if (matchingChallenges.length > 1) {
          // Multiple duplicates exist - log warning but don't create another
          console.warn(`⚠️ Multiple weekly challenge instances found for "${challenge.title}" (entry_fee: ${challenge.entry_fee || 0}): ${matchingChallenges.length} instances`);
        }
        // If exactly 1 exists, that's correct - do nothing
      }
    } catch (error) {
      console.error('Error handling weekly recurring challenge:', error);
    }
  }

  /**
   * Create a new instance of a daily recurring challenge
   */
  private async createDailyRecurringInstance(
    originalChallenge: Challenge,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    try {
      // Create new challenge instance for next day
      const { data: newChallenge, error: challengeError } = await supabase
        .from('challenges')
        .insert({
          title: originalChallenge.title,
          description: originalChallenge.description,
          category: originalChallenge.category,
          duration_weeks: originalChallenge.duration_weeks,
          entry_fee: originalChallenge.entry_fee,
          verification_type: originalChallenge.verification_type,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          created_by: originalChallenge.created_by,
          status: 'upcoming', // Will become active at 1pm
          image_url: originalChallenge.image_url,
          is_recurring: true,
          recurring_schedule: 'daily',
          is_pro_only: originalChallenge.is_pro_only || false,
          next_recurrence: new Date(endDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (challengeError) {
        console.error('Error creating daily recurring challenge instance:', challengeError);
        return;
      }

      // Copy requirements
      const { data: requirements } = await supabase
        .from('challenge_requirements')
        .select('requirement_text, frequency, target_count, requirement_order')
        .eq('challenge_id', originalChallenge.id);

      if (requirements && requirements.length > 0) {
        const newRequirements = requirements.map(req => ({
          challenge_id: newChallenge.id,
          requirement_text: req.requirement_text,
          frequency: req.frequency,
          target_count: req.target_count,
          requirement_order: req.requirement_order,
        }));

        const { error: reqError } = await supabase
          .from('challenge_requirements')
          .insert(newRequirements);

        if (reqError) {
          console.error('Error copying requirements for daily recurring challenge:', reqError);
        }
      }

      console.log(`✅ Created daily recurring challenge instance: ${newChallenge.title} for ${startDate.toISOString()}`);
    } catch (error) {
      console.error('Error in createDailyRecurringInstance:', error);
    }
  }

  /**
   * Create a new instance of a weekly recurring challenge
   */
  private async createRecurringInstance(originalChallenge: Challenge): Promise<void> {
    try {
      // Simple: next Monday after the end date
      const endDate = new Date(originalChallenge.end_date);
      const nextWeekStart = new Date(endDate);
      nextWeekStart.setDate(endDate.getDate() + 1); // Move to Monday
      nextWeekStart.setUTCHours(0, 1, 0, 0);
      
      // End is 6 days later (Sunday)
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
      nextWeekEnd.setUTCHours(23, 59, 59, 999);
      
      // Create new challenge instance for next week
      const { data: newChallenge, error: challengeError } = await supabase
        .from('challenges')
        .insert({
          title: originalChallenge.title,
          description: originalChallenge.description,
          category: originalChallenge.category,
          duration_weeks: originalChallenge.duration_weeks,
          entry_fee: originalChallenge.entry_fee,
          verification_type: originalChallenge.verification_type,
          start_date: nextWeekStart.toISOString(),
          end_date: nextWeekEnd.toISOString(),
          created_by: originalChallenge.created_by,
          status: 'active',
          image_url: originalChallenge.image_url,
          is_recurring: true,
          recurring_schedule: originalChallenge.recurring_schedule,
          is_pro_only: originalChallenge.is_pro_only || false,
          next_recurrence: new Date(nextWeekEnd.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (challengeError) {
        console.error('Error creating recurring challenge instance:', challengeError);
        return;
      }

      // Copy requirements
      const { data: requirements } = await supabase
        .from('challenge_requirements')
        .select('requirement_text, frequency, target_count, requirement_order')
        .eq('challenge_id', originalChallenge.id);

      if (requirements && requirements.length > 0) {
        const newRequirements = requirements.map(req => ({
          challenge_id: newChallenge.id,
          requirement_text: req.requirement_text,
          frequency: req.frequency,
          target_count: req.target_count,
          requirement_order: req.requirement_order,
        }));

        await supabase
          .from('challenge_requirements')
          .insert(newRequirements);
      }

      // Update the original challenge's next_recurrence
      const nextRecurrenceDate = new Date(nextWeekEnd.getTime() + 24 * 60 * 60 * 1000);
      nextRecurrenceDate.setUTCHours(0, 1, 0, 0);

      await supabase
        .from('challenges')
        .update({ next_recurrence: nextRecurrenceDate.toISOString() })
        .eq('id', originalChallenge.id);
    } catch (error) {
      console.error('Error creating recurring instance:', error);
    }
  }

  /**
   * Redistribute pot when challenge ends
   */
  async redistributePot(challengeId: string): Promise<void> {
    try {
      console.log('Redistributing pot for challenge:', challengeId);
      await challengePotService.distributePot(challengeId);
      console.log('✅ Pot redistribution complete for challenge:', challengeId);
    } catch (error) {
      console.error('Error redistributing pot:', error);
      throw error;
    }
  }

  /**
   * Create a new challenge (admin only for now)
   */
  async createChallenge(challengeData: CreateChallengeData): Promise<Challenge> {
    try {
      // Insert challenge
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .insert({
          title: challengeData.title,
          description: challengeData.description,
          category: challengeData.category,
          duration_weeks: challengeData.duration_weeks,
          entry_fee: challengeData.entry_fee || 0,
          verification_type: challengeData.verification_type || 'photo',
          start_date: challengeData.start_date,
          end_date: challengeData.end_date,
          max_participants: challengeData.max_participants,
          image_url: challengeData.image_url,
          is_pro_only: challengeData.is_pro_only || false,
          status: 'upcoming',
        })
        .select()
        .single();

      if (challengeError) {
        console.error('Error creating challenge:', challengeError);
        throw challengeError;
      }

      // Insert requirements
      if (challengeData.requirements.length > 0) {
        const requirements = challengeData.requirements.map((req, index) => ({
          challenge_id: challenge.id,
          requirement_text: req.requirement_text,
          frequency: req.frequency,
          target_count: req.target_count,
          requirement_order: index + 1,
        }));

        const { error: requirementsError } = await supabase
          .from('challenge_requirements')
          .insert(requirements);

        if (requirementsError) {
          console.error('Error creating requirements:', requirementsError);
        }
      }

      return challenge;
    } catch (error) {
      console.error('Error in createChallenge:', error);
      throw error;
    }
  }

  /**
   * Generate unique join code for private challenges
   */
  private generateJoinCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  /**
   * Create user challenge (private or public request)
   */
  async createUserChallenge(
    userId: string, 
    challengeData: CreateChallengeData
  ): Promise<{ challenge: Challenge; joinCode?: string }> {
    try {
      const joinCode = challengeData.visibility === 'private' 
        ? this.generateJoinCode() 
        : undefined;

      const { data: challenge, error } = await supabase
        .from('challenges')
        .insert({
          title: challengeData.title,
          description: challengeData.description,
          category: challengeData.category,
          duration_weeks: challengeData.duration_weeks,
          entry_fee: challengeData.entry_fee || 0,
          verification_type: challengeData.verification_type || 'photo',
          start_date: challengeData.start_date,
          end_date: challengeData.end_date,
          max_participants: challengeData.max_participants,
          image_url: challengeData.image_url,
          created_by: userId,
          is_user_created: true,
          join_code: joinCode,
          visibility: challengeData.visibility || 'public',
          status: 'active', // User challenges start immediately
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user challenge:', error);
        throw error;
      }

      // Insert requirements
      if (challengeData.requirements.length > 0) {
        const requirements = challengeData.requirements.map((req, index) => ({
          challenge_id: challenge.id,
          requirement_text: req.requirement_text,
          frequency: req.frequency,
          target_count: req.target_count,
          requirement_order: index + 1,
        }));

        const { error: requirementsError } = await supabase
          .from('challenge_requirements')
          .insert(requirements);

        if (requirementsError) {
          console.error('Error creating requirements:', requirementsError);
        }
      }

      return { challenge, joinCode };
    } catch (error) {
      console.error('Error in createUserChallenge:', error);
      throw error;
    }
  }

  /**
   * Join challenge by code
   */
  /**
   * Get challenge details by join code (without joining)
   */
  async getChallengeByCode(code: string): Promise<Challenge | null> {
    try {
      const { data: challenge, error: findError } = await supabase
        .from('challenges')
        .select('*')
        .eq('join_code', code.toUpperCase())
        .eq('visibility', 'private')
        .single();

      if (findError || !challenge) {
        return null;
      }

      return challenge;
    } catch (error) {
      console.error('Error fetching challenge by code:', error);
      return null;
    }
  }

  async joinChallengeByCode(userId: string, code: string): Promise<Challenge> {
    try {
      // Find challenge by code
      const { data: challenge, error: findError } = await supabase
        .from('challenges')
        .select('*')
        .eq('join_code', code.toUpperCase())
        .eq('visibility', 'private')
        .single();

      if (findError || !challenge) {
        throw new Error('Invalid join code');
      }

      // Join the challenge (reuse existing joinChallenge logic)
      await this.joinChallenge(challenge.id, userId);
      
      return challenge;
    } catch (error) {
      console.error('Error joining challenge by code:', error);
      throw error;
    }
  }

  /**
   * Get challenges created by user
   */
  async getUserCreatedChallenges(userId: string): Promise<Challenge[]> {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('*, challenge_requirements(*)')
        .eq('created_by', userId)
        .eq('is_user_created', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting user created challenges:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        return [];
      }

      // Get participant counts for all challenges
      const challengeIds = data.map(c => c.id);
      const { data: participantCounts, error: countError } = await supabase
        .from('challenge_participants')
        .select('challenge_id')
        .in('challenge_id', challengeIds);

      if (countError) {
        console.error('Error getting participant counts:', countError);
      }

      // Create a map of challenge_id -> count
      const countMap = new Map<string, number>();
      if (participantCounts) {
        participantCounts.forEach((p: any) => {
          const current = countMap.get(p.challenge_id) || 0;
          countMap.set(p.challenge_id, current + 1);
        });
      }

      // Add participant_count to each challenge
      return data.map(challenge => ({
        ...challenge,
        participant_count: countMap.get(challenge.id) || 0,
      }));
    } catch (error) {
      console.error('Error in getUserCreatedChallenges:', error);
      return [];
    }
  }

  /**
   * Update user challenge
   */
  async updateUserChallenge(
    challengeId: string,
    userId: string,
    updates: Partial<CreateChallengeData>
  ): Promise<Challenge> {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .update(updates)
        .eq('id', challengeId)
        .eq('created_by', userId)
        .eq('is_user_created', true)
        .select()
        .single();

      if (error) {
        console.error('Error updating user challenge:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in updateUserChallenge:', error);
      throw error;
    }
  }

  /**
   * Delete user challenge
   */
  async deleteUserChallenge(challengeId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', challengeId)
        .eq('created_by', userId)
        .eq('is_user_created', true);

      if (error) {
        console.error('Error deleting user challenge:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteUserChallenge:', error);
      throw error;
    }
  }

  /**
   * Check if challenge has non-PRO participants
   */
  async hasNonProParticipants(challengeId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('user_id, profiles!inner(is_pro)')
        .eq('challenge_id', challengeId);

      if (error) {
        console.error('Error checking non-pro participants:', error);
        return false;
      }

      return data?.some((p: any) => !p.profiles?.is_pro) || false;
    } catch (error) {
      console.error('Error in hasNonProParticipants:', error);
      return false;
    }
  }

  // Track if check is in progress to prevent concurrent executions
  private isCheckingEndedChallenges = false;

  /**
   * Mark challenge as pending review when it ends
   */
  async markChallengeAsPendingReview(challengeId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('challenges')
        .update({
          approval_status: 'pending',
          status: 'completed',
        })
        .eq('id', challengeId);

      if (error) {
        console.error('Error marking challenge as pending review:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in markChallengeAsPendingReview:', error);
      throw error;
    }
  }

  /**
   * Check and update ended challenges to pending review status
   * Only processes challenges that end from now onwards (not historical challenges)
   */
  async checkAndUpdateEndedChallenges(): Promise<void> {
    // Prevent concurrent executions
    if (this.isCheckingEndedChallenges) {
      return;
    }

    this.isCheckingEndedChallenges = true;

    try {
      const now = new Date();
      // Add 1 hour grace period - only mark challenges for review if they ended more than 1 hour ago
      // This prevents daily challenges from being marked immediately at midnight
      const gracePeriod = new Date(now.getTime() - (1 * 60 * 60 * 1000)); // 1 hour ago
      const gracePeriodISO = gracePeriod.toISOString();

      // Find challenges that have ended but don't have approval_status set
      // Check all ended challenges regardless of when they ended (removed date restriction)
      // Include 'upcoming', 'active', and 'completed' statuses to catch all scenarios
      const { data: endedChallenges, error } = await supabase
        .from('challenges')
        .select('id, title, end_date, status')
        .lt('end_date', gracePeriodISO) // Has ended more than 1 hour ago
        .is('approval_status', null) // Not yet processed
        .in('status', ['upcoming', 'active', 'completed']); // Include all possible statuses

      if (error) {
        console.error('Error fetching ended challenges:', error);
        return;
      }

      if (!endedChallenges || endedChallenges.length === 0) {
        return;
      }

      console.log(`🔍 Found ${endedChallenges.length} challenge(s) that need review`);

      let successCount = 0;
      // Update each challenge to pending review
      for (const challenge of endedChallenges) {
        try {
          await this.markChallengeAsPendingReview(challenge.id);
          successCount++;
        } catch (error) {
          console.error(`Error updating challenge ${challenge.id} (${challenge.title}):`, error);
          // Continue with other challenges
        }
      }

      if (successCount > 0) {
        console.log(`✅ Updated ${successCount} challenge(s) to pending review`);
      }
    } catch (error) {
      console.error('Error in checkAndUpdateEndedChallenges:', error);
    } finally {
      this.isCheckingEndedChallenges = false;
    }
  }
}

export const challengesService = new ChallengesService();
