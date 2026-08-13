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
  CHALLENGE_ENTRY_FEES,
  FREE_USER_MAX_ACTIVE_CHALLENGES,
  isChallengeActive,
  isChallengeUpcoming,
  getChallengeWeekNumber,
  isRecurringChallenge,
  getCurrentWeekForRecurringChallenge,
  getCurrentRecurringPeriod,
} from '../types/challenges';
import { isProOnlyChallengeTitle, isRetiredPublicChallengeTitle, getStepChallengeConfig, getStepChallengeEntryFee } from './challengeTitleUtils';
import { localDeviceCalendarYmd } from './timeService';

/** Official public entry fee for recurring system challenges (never copy stale £10 templates). */
function resolveOfficialEntryFee(challenge: {
  title: string;
  entry_fee?: number | null;
  is_pro_only?: boolean | null;
}): number {
  const stepFee = getStepChallengeEntryFee(challenge.title);
  if (stepFee != null) return stepFee;

  const current = Number(challenge.entry_fee) || 0;
  if (current <= 0) return 0;
  if (challenge.is_pro_only || isProOnlyChallengeTitle(challenge.title)) {
    return CHALLENGE_ENTRY_FEES.PRO;
  }
  return CHALLENGE_ENTRY_FEES.STANDARD;
}

function resolveIsProOnly(challenge: {
  title: string;
  is_pro_only?: boolean | null;
}): boolean {
  // Step challenges are always open to everyone
  if (getStepChallengeConfig(challenge.title)) return false;
  return !!(challenge.is_pro_only || isProOnlyChallengeTitle(challenge.title));
}

/** Next start on preferred weekday after endDate, lasting durationDays (inclusive). */
function getNextWeekdayDurationWindow(
  endDate: Date,
  startWeekday: number,
  durationDays: number
): { start: Date; end: Date } {
  const start = new Date(endDate);
  start.setUTCDate(start.getUTCDate() + 1);
  start.setUTCHours(0, 1, 0, 0);

  const day = start.getUTCDay();
  const daysUntil = (startWeekday - day + 7) % 7;
  start.setUTCDate(start.getUTCDate() + daysUntil);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + Math.max(1, durationDays) - 1);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
}

class ChallengesService {
  /**
   * Validate that userId matches the authenticated user
   * This adds an extra security layer on top of RLS
   */
  private async validateUserId(userId: string): Promise<void> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('User not authenticated');
    }
    if (user.id !== userId) {
      throw new Error('Unauthorized: User ID mismatch');
    }
  }
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

      // Filter on the DB side: only fetch active/upcoming challenges, or recently
      // ended ones (within 14 days) so the compete screen has a bridge to show.
      // This prevents the list from growing unboundedly as recurring challenges accumulate.
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

      let query = supabase
        .from('challenges')
        .select('*')
        .or(`status.in.(active,upcoming),and(status.eq.completed,end_date.gte.${twoWeeksAgo})`)
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

      // Map counts + normalize official fees (stop stale £10 templates leaking into UI)
      let challenges = (data || []).map((challenge) => {
        const base = {
          ...challenge,
          participant_count: countMap.get(challenge.id) || 0,
          approval_status: challenge.approval_status || undefined,
        };
        if (base.is_user_created) return base;
        const fee = Number(base.entry_fee) || 0;
        if (fee <= 0) {
          return { ...base, entry_fee: 0, is_pro_only: false };
        }
        return {
          ...base,
          entry_fee: resolveOfficialEntryFee(base),
          is_pro_only: resolveIsProOnly(base),
        };
      });

      // Aggressive deduplication: Remove duplicates by title + date (ignore fee)
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
        
        const dedupKey = `${challenge.title}_${dateKey}`;
        
        const existing = challengeMap.get(dedupKey);
        if (!existing) {
          challengeMap.set(dedupKey, challenge);
        } else {
          duplicateCount.found++;
          const preferCurrent =
            (challenge.status === 'active' || challenge.status === 'upcoming') &&
            existing.status !== 'active' &&
            existing.status !== 'upcoming';
          const existingDate = new Date(existing.created_at || existing.start_date);
          const currentDate = new Date(challenge.created_at || challenge.start_date);
          if (preferCurrent || currentDate > existingDate) {
            duplicateCount.removed++;
            challengeMap.set(dedupKey, challenge);
          } else {
            duplicateCount.removed++;
          }
        }
      });
      challenges = Array.from(challengeMap.values());

      // Filter recurring challenges to only show current period's instances
      const now = new Date();
      const filteredChallenges: Challenge[] = [];
      const recurringTitles = new Set<string>();
      const seenChallengeIds = new Set<string>(); // Track by ID to prevent duplicates

      if (__DEV__) {
        console.log(`🔍 [getChallenges] Filtering ${challenges.length} challenges at ${now.toISOString()}`);
      }

      for (const challenge of challenges) {
        if (isRetiredPublicChallengeTitle(challenge.title)) {
          continue;
        }
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
            // Daily challenges: only show today's instance (not tomorrow's preview)
            const today = new Date(now);
            today.setUTCHours(0, 0, 0, 0);
            const challengeDay = new Date(challengeStart);
            challengeDay.setUTCHours(0, 0, 0, 0);

            const isToday = challengeDay.getTime() === today.getTime();

            if (isToday) {
              // Auto-activate if start time has passed
              if (challenge.status === 'upcoming' && now >= challengeStart) {
                await supabase
                  .from('challenges')
                  .update({ status: 'active' })
                  .eq('id', challenge.id);
                challenge.status = 'active';
              }

              // One card per daily title (today only)
              const key = challenge.title;
              if (!recurringTitles.has(key)) {
                filteredChallenges.push(challenge);
                recurringTitles.add(key);
              }
            }
          } else {
            // For weekly recurring challenges, show current week's instance
            const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            const isActive = (now >= challengeStart && now <= challengeEnd);
            const isUpcoming = (now < challengeStart && challengeStart <= oneWeekFromNow);
            // Bridge only for challenges that ended within the last week (not all history)
            const isRecentlyEnded = now > challengeEnd && challengeEnd >= oneWeekAgo;
            
            if (__DEV__) {
              console.log(`📅 [Weekly] ${challenge.title}:`, {
                start: challengeStart.toISOString(),
                end: challengeEnd.toISOString(),
                status: challenge.status,
                isActive,
                isUpcoming,
                isRecentlyEnded,
                willShow: isActive || isUpcoming || isRecentlyEnded,
              });
            }
            
            // Show if active, upcoming, or recently ended (to bridge gaps)
            if (isActive || isUpcoming || isRecentlyEnded) {
              const key = challenge.title;
              const existingIdx = filteredChallenges.findIndex(
                (c) => c.is_recurring && c.title === key
              );
              if (existingIdx < 0) {
                filteredChallenges.push(challenge);
                recurringTitles.add(key);
                if (__DEV__) {
                  console.log(`  ✅ Added ${challenge.title}`);
                }
              } else {
                const existing = filteredChallenges[existingIdx];
                const existingLive =
                  existing.status === 'active' || existing.status === 'upcoming';
                const currentLive =
                  challenge.status === 'active' || challenge.status === 'upcoming';
                if (currentLive && !existingLive) {
                  filteredChallenges[existingIdx] = challenge;
                }
                if (__DEV__) {
                  console.log(`  ⏭️  Skipped duplicate ${challenge.title}`);
                }
              }
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
          .select('id, username, avatar_url, display_name, is_pro')
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

      const normalized = challenge.is_user_created
        ? challenge
        : {
            ...challenge,
            entry_fee:
              Number(challenge.entry_fee) > 0
                ? resolveOfficialEntryFee(challenge)
                : 0,
            is_pro_only:
              Number(challenge.entry_fee) > 0 ? resolveIsProOnly(challenge) : false,
          };

      // Heal stale £10 (etc.) on live system challenges so join charges the official fee
      if (
        !challenge.is_user_created &&
        Number(challenge.entry_fee) > 0 &&
        Number(normalized.entry_fee) !== Number(challenge.entry_fee)
      ) {
        void supabase
          .from('challenges')
          .update({
            entry_fee: normalized.entry_fee,
            is_pro_only: normalized.is_pro_only,
          })
          .eq('id', challenge.id);
      }

      return {
        ...normalized,
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
   * Pay challenge entry fee from wallet balance (debit wallet + pot tracking id).
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
      await this.validateUserId(userId);

      const { data: challenge } = await supabase
        .from('challenges')
        .select('id, title, duration_weeks, is_pro_only, status')
        .eq('id', challengeId)
        .single();

      if (!challenge) throw new Error('Challenge not found');
      await this.assertCanJoinChallenge(userId, challenge);

      const { paymentIntentId } = await stripeService.payChallengeFromWallet(
        userId,
        challengeId,
        entryFee
      );
      
      return {
        paymentIntentId,
        clientSecret: '',
      };
    } catch (error) {
      console.error('Error initiating challenge join with wallet:', error);
      throw error;
    }
  }

  /**
   * Challenge join access:
   * - Free: max FREE_USER_MAX_ACTIVE_CHALLENGES concurrent active/upcoming joins
   * - Pro: unlimited
   * - Pro-only challenges require Pro
   */
  async checkChallengeAccessForUser(
    userId: string,
    _durationWeeks?: number,
    options?: {
      challengeId?: string;
      isProOnly?: boolean;
      title?: string;
    }
  ): Promise<void> {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error loading profile for challenge access:', profileError);
    }

    const isPro = !!profile?.is_pro;
    const isProOnly =
      !!options?.isProOnly ||
      (!!options?.title && isProOnlyChallengeTitle(options.title));

    if (isProOnly && !isPro) {
      throw new Error('This is a Pro challenge. Upgrade to Pro to join.');
    }

    // Pro members: unlimited concurrent challenges
    if (isPro) return;

    const { data: rows, error } = await supabase
      .from('challenge_participants')
      .select(
        `
        challenge_id,
        status,
        challenge:challenges!inner (
          id,
          status,
          end_date
        )
      `
      )
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Error counting active challenge joins:', error);
      throw new Error('Could not verify challenge limits. Please try again.');
    }

    const now = Date.now();
    const activeCount = (rows || []).filter((row: any) => {
      const c = row.challenge;
      if (!c) return false;
      // Rejoining / completing payment for the same challenge doesn't consume an extra slot
      if (options?.challengeId && row.challenge_id === options.challengeId) return false;
      if (c.status === 'cancelled' || c.status === 'completed') return false;
      const end = new Date(c.end_date);
      end.setHours(23, 59, 59, 999);
      if (end.getTime() < now) return false;
      return c.status === 'active' || c.status === 'upcoming';
    }).length;

    if (activeCount >= FREE_USER_MAX_ACTIVE_CHALLENGES) {
      throw new Error(
        `Free members can join up to ${FREE_USER_MAX_ACTIVE_CHALLENGES} challenges at a time. Upgrade to Pro for unlimited challenges, or finish/leave one first.`
      );
    }
  }

  /**
   * Shared gate used by all join entry points (before charging wallet).
   */
  private async assertCanJoinChallenge(
    userId: string,
    challenge: {
      id: string;
      duration_weeks?: number;
      is_pro_only?: boolean | null;
      title?: string;
    }
  ): Promise<void> {
    await this.checkChallengeAccessForUser(userId, challenge.duration_weeks, {
      challengeId: challenge.id,
      isProOnly: !!challenge.is_pro_only || resolveIsProOnly(challenge as any),
      title: challenge.title,
    });
  }

  /**
   * @deprecated Hold escrow removed — use wallet join (initiateChallengeJoinWithWallet).
   */
  async initiateChallengeJoinWithHold(
    _challengeId: string,
    _userId: string
  ): Promise<{
    setupIntentClientSecret: string;
    setupIntentId: string;
    entryFee: number;
  }> {
    throw new Error(
      'Card hold escrow has been removed. Join by paying from your wallet (top up if needed).'
    );
  }

  /**
   * @deprecated Hold escrow removed — use completeChallengeJoin after wallet payment.
   */
  async completeHoldChallengeJoin(
    _challengeId: string,
    _userId: string,
    _setupIntentId: string,
    _paymentMethodId: string
  ): Promise<void> {
    throw new Error(
      'Card hold escrow has been removed. Join by paying from your wallet (top up if needed).'
    );
  }

  /**
   * Initiate challenge join - legacy immediate card capture path (unused by UI).
   * Prefer wallet flow: initiateChallengeJoinWithWallet + completeChallengeJoin.
   */
  async initiateChallengeJoin(challengeId: string, userId: string): Promise<{
    paymentIntentId: string;
    clientSecret: string;
    entryFee: number;
    stripeFee: number;
    totalAmount: number;
  }> {
    await this.validateUserId(userId);
    try {
      const { data: challenge } = await supabase
        .from('challenges')
        .select('*, status, start_date, max_participants, is_recurring, title, recurring_schedule, entry_fee, duration_weeks')
        .eq('id', challengeId)
        .single();

      if (!challenge) throw new Error('Challenge not found');

      await this.assertCanJoinChallenge(userId, challenge);

      const { data: existing } = await supabase
        .from('challenge_participants')
        .select('id, status')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .single();

      if (existing && existing.status === 'active') throw new Error('Already joined this challenge');

      if (challenge.status !== 'active' && challenge.status !== 'upcoming') {
        throw new Error('Challenge is not open for joining');
      }

      const entryFee = challenge.entry_fee || 0;

      if (entryFee > 0) {
        throw new Error(
          'Please join from the challenge screen so entry can be paid from your wallet.'
        );
      }

      await this.completeChallengeJoin(challengeId, userId, null);
      return { paymentIntentId: '', clientSecret: '', entryFee: 0, stripeFee: 0, totalAmount: 0 };
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
    // Validate user ID matches authenticated user
    await this.validateUserId(userId);
    try {
      // Get challenge details
      const { data: challenge } = await supabase
        .from('challenges')
        .select('entry_fee, title, is_pro_only, is_user_created, duration_weeks, id')
        .eq('id', challengeId)
        .single();

      if (!challenge) {
        throw new Error('Challenge not found');
      }

      await this.assertCanJoinChallenge(userId, challenge);

      const entryFee = challenge.is_user_created
        ? Number(challenge.entry_fee) || 0
        : resolveOfficialEntryFee(challenge);

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
            payment_capture_method: entryFee > 0 ? 'wallet' : 'free',
            payment_settled: entryFee > 0,
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
            // Must match DB check: hold | wallet_escrow | wallet | free | immediate
            payment_capture_method: entryFee > 0 ? 'wallet' : 'free',
            payment_settled: entryFee > 0,
          });

        if (error) {
          throw error;
        }
      }

      // Update challenge pot tracking
      if (entryFee > 0) {
        try {
          await challengePotService.addInvestment(challengeId, userId, entryFee);
        } catch (potError) {
          // Non-critical error, log but don't fail
          if (__DEV__) {
            console.error('Error updating pot (non-critical):', potError);
          }
        }
      }

      // Invalidate challenge cache
      apiCache.delete(apiCache.generateKey('challenges', 'all'));
      apiCache.delete(apiCache.generateKey('challenges', 'active'));
      apiCache.delete(apiCache.generateKey('challenges', 'upcoming'));

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
      
      // Get challenge details first
      const { data: challenge } = await supabase
        .from('challenges')
        .select('*, status, start_date, max_participants, is_recurring, title, recurring_schedule')
        .eq('id', challengeId)
        .single();

      if (!challenge) {
        throw new Error('Challenge not found');
      }

      await this.assertCanJoinChallenge(userId, challenge);

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

      const entryFee = challenge.is_user_created
        ? Number(challenge.entry_fee) || 0
        : resolveOfficialEntryFee(challenge);

      if (
        !challenge.is_user_created &&
        Number(challenge.entry_fee) > 0 &&
        entryFee !== Number(challenge.entry_fee)
      ) {
        await supabase
          .from('challenges')
          .update({
            entry_fee: entryFee,
            is_pro_only: resolveIsProOnly(challenge),
          })
          .eq('id', challengeId);
      }

      // For challenges with entry fee, payment is handled via Stripe Connect escrow
      // The payment intent is created and user pays via Stripe Payment Sheet
      // This function just creates the participant record - payment happens in the UI
      let stripePaymentIntentId: string | null = null;

      // Note: Payment Intent creation and payment happens in the UI (ChallengeDetailScreen)
      // This function is called after payment succeeds
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
        throw error;
      }

      // Update challenge pot (for tracking, but funds are in Stripe escrow)
      if (entryFee > 0) {
        try {
          await challengePotService.addInvestment(challengeId, userId, entryFee);
        } catch (potError) {
          // Non-critical error, continue
          if (__DEV__) {
            console.error('Error updating pot (non-critical):', potError);
          }
        }
      }

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
          
          // 1. Credit the user's wallet in DB
          await walletService.refundChallengePayment(userId, entryFee, challengeId);
          
          // 2. Remove the investment from the challenge pot
          await challengePotService.removeInvestment(challengeId, userId, entryFee);
          
          if (__DEV__) {
            console.log('Refunded challenge payment to wallet');
          }
          
          // Note: We do NOT call stripeService.refundChallengePayment() anymore.
          // That would trigger a refund to the card. We want to keep funds in the system (wallet).
          
        } catch (refundError) {
          // Continue with leaving even if refund fails
          if (__DEV__) {
            console.error('Error refunding challenge payment:', refundError);
          }
        }
      }

      // Remove participant record
      const { error } = await supabase
        .from('challenge_participants')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      // Invalidate challenge cache
      apiCache.delete(apiCache.generateKey('challenges', 'all'));
      apiCache.delete(apiCache.generateKey('challenges', 'active'));
      apiCache.delete(apiCache.generateKey('challenges', 'upcoming'));

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
    // Validate user ID matches authenticated user
    await this.validateUserId(userId);
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

      let challenges = (data?.map((item: any) => item.challenge).filter(Boolean) || []) as unknown as Challenge[];
      challenges = challenges.filter((c) => !isRetiredPublicChallengeTitle(c.title));

      if (challenges.length === 0) {
        return [];
      }

      // Get participant counts for all challenges in a single batch query
      const challengeIds = challenges.map((c: Challenge) => c.id);
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
      return challenges.map((challenge: Challenge) => ({
        ...challenge,
        participant_count: countMap.get(challenge.id) || 0,
      })) as Challenge[];
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
    photoUrl: string | null,
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
      const startYmd = String(challenge.start_date).split('T')[0].slice(0, 10);
      const endYmd = String(challenge.end_date).split('T')[0].slice(0, 10);
      const proofDayYmd = localDeviceCalendarYmd();

      if (proofDayYmd < startYmd || proofDayYmd > endYmd) {
        throw new Error(
          'You can only submit proof on a day the challenge is running. Past challenge days cannot be added or changed.'
        );
      }

      const challengeEndMoment = new Date(challenge.end_date);
      challengeEndMoment.setHours(23, 59, 59, 999);
      if (now > challengeEndMoment) {
        throw new Error('This challenge has ended. You can no longer upload proof.');
      }

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

      // Check if submission already exists for TODAY using submission_date
      // The unique constraint on (challenge_id, user_id, submission_date) will prevent duplicates
      const { data: todaySubmission } = await supabase
        .from('challenge_submissions')
        .select('id, submitted_at, submission_date')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .eq('submission_date', proofDayYmd)
        .maybeSingle();
      
      if (__DEV__) {
        console.log('🔍 Checking for today\'s submission:', {
          challengeId,
          userId,
          proofDayYmd,
          hasTodaySubmission: !!todaySubmission,
          todaySubmission: todaySubmission ? {
            id: todaySubmission.id,
            submitted_at: todaySubmission.submitted_at,
            submission_date: todaySubmission.submission_date,
          } : null,
        });
      }
      
      let submissionId: string | undefined;

      if (todaySubmission) {
        // Update today's submission with new photo (user is resubmitting same day)
        if (__DEV__) {
          console.log('📝 Updating today\'s existing submission');
        }
        
        const { error } = await supabase
          .from('challenge_submissions')
          .update({
            photo_url: photoUrl,
            submission_notes: submissionNotes,
            verification_status: 'pending',
            submitted_at: new Date().toISOString(), // Update timestamp
          })
          .eq('id', todaySubmission.id);

        if (error) {
          console.error('❌ Error updating submission:', error);
          throw error;
        }
        
        if (__DEV__) {
          console.log('✅ Today\'s submission updated successfully');
        }
        
        submissionId = todaySubmission.id;
      }
      
      if (!todaySubmission) {
        // Get challenge to check verification type
        const { data: challengeData } = await supabase
          .from('challenges')
          .select('verification_type, title')
          .eq('id', challengeId)
          .single();

        // Automatic / Apple Health step submissions can omit a photo
        const isAutomatic = challengeData?.verification_type === 'automatic';
        const isHealthSteps =
          !photoUrl &&
          !!submissionNotes &&
          /apple health/i.test(submissionNotes) &&
          /step/i.test(challengeData?.title || '');
        const allowWithoutPhoto = isAutomatic || isHealthSteps;

        if (!photoUrl && !allowWithoutPhoto) {
          throw new Error('A photo is required for this challenge submission.');
        }

        if (__DEV__) {
          console.log('📝 Creating new submission:', {
            challengeId,
            userId,
            weekNumber,
            hasPhoto: !!photoUrl,
            isAutomatic,
            isHealthSteps,
          });
        }

        const { data: newSubmission, error } = await supabase
          .from('challenge_submissions')
          .insert({
            challenge_id: challengeId,
            user_id: userId,
            photo_url: photoUrl || null,
            week_number: weekNumber,
            submission_notes: submissionNotes,
            verification_status: allowWithoutPhoto ? 'approved' : 'pending',
            submission_date: proofDayYmd,
          })
          .select('*')
          .single();

        if (error) {
          console.error('❌ Error creating submission:', error);
          throw error;
        }

        if (__DEV__) {
          console.log('✅ Submission created successfully:', {
            submission: newSubmission,
            submissionId: newSubmission?.id,
            submittedAt: newSubmission?.submitted_at,
            weekNumber: newSubmission?.week_number,
          });
        }

        submissionId = newSubmission?.id;
      }

      // Track daily proof for pot system (if challenge has entry fee)
      try {
        await challengePotService.trackDailyProof(
          challengeId,
          userId,
          proofDayYmd,
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
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
        throw error;
      }

      if (__DEV__) {
        console.log('📋 Fetched submissions:', {
          challengeId,
          userId,
          count: data?.length || 0,
          submissions: data?.map(s => ({
            id: s.id,
            week_number: s.week_number,
            submitted_at: s.submitted_at,
            date: new Date(s.submitted_at).toDateString(),
          })),
        });
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
        return false;
      }

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
          return false;
        }
        if (__DEV__) {
          console.error('Error checking participation:', error);
        }
        return false;
      }

      // Return true if participation exists AND status is 'active' or 'completed'
      // Status can be 'active', 'completed', 'failed', or 'left' - we want 'active' and 'completed'
      const isParticipating = !!participation && (participation.status === 'active' || participation.status === 'completed');

      return isParticipating;
    } catch (error) {
      if (__DEV__) {
        console.error('Error in isUserParticipating:', error);
      }
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
   * Handle recurring challenge logic - create new instances for recurring challenges.
   * Self-healing: queries ALL recurring instances (including completed ones) to find the
   * most recent per unique challenge, then fills in any missing weeks up to today.
   * This fixes broken chains where no active/upcoming instance exists.
   */
  async handleRecurringChallenges(): Promise<void> {
    try {
      // Fetch ALL recurring challenges ordered by end_date descending.
      // Including completed ones is the key fix — previously only active/upcoming
      // were queried, so once the chain ended it could never restart.
      const { data: allRecurring, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_recurring', true)
        .order('end_date', { ascending: false });

      if (error) {
        console.error('Error fetching recurring challenges:', error);
        return;
      }

      // Deduplicate: keep only the most recent instance per unique recurring challenge.
      // Key by title + schedule only (NOT entry_fee) so old £10 templates can't spawn a parallel chain.
      const mostRecent = new Map<string, Challenge>();
      for (const c of allRecurring || []) {
        const key = `${c.title}_${c.recurring_schedule || 'weekly'}`;
        if (!mostRecent.has(key)) {
          mostRecent.set(key, c); // First = most recent (sorted by end_date desc)
        }
      }

      if (__DEV__) {
        console.log(`🔄 [handleRecurringChallenges] Found ${mostRecent.size} unique recurring challenge(s)`);
      }

      const now = new Date();

      for (const challenge of mostRecent.values()) {
        const schedule = challenge.recurring_schedule || 'weekly';
        if (__DEV__) {
          console.log(`  Processing: ${challenge.title} (${schedule})`);
        }
        if (schedule === 'daily') {
          await this.handleDailyRecurringChallenge(challenge, now);
        } else {
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
      
      // Prefer any existing instance for this title today (fee may have been migrated)
      const matchingTodayChallenges = todayChallenges || [];
      
      // If multiple exist, log and keep only the first one (we'll deduplicate in getChallenges)
      if (matchingTodayChallenges.length > 1) {
        console.warn(`⚠️ Multiple daily recurring challenge instances found for today (${challenge.title}): ${matchingTodayChallenges.length} instances`);
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

        // Any instance for this title tomorrow counts (fee may have been migrated)
        const matchingExisting = existingChallenges || [];

        // Only create if no matching challenge exists for tomorrow
        if (matchingExisting.length === 0) {
          await this.createDailyRecurringInstance(challenge, nextDayStart, nextDayEnd);
        } else if (matchingExisting.length > 1) {
          console.warn(`⚠️ Multiple daily recurring challenge instances found for tomorrow (${challenge.title}): ${matchingExisting.length} instances`);
        }
      }
    } catch (error) {
      console.error('Error handling daily recurring challenge:', error);
    }
  }

  /**
   * Weekly recurring challenges always run Monday–Sunday (UTC).
   * Returns the next Mon–Sun window starting on or after the day after `endDate`.
   */
  private getNextMondaySundayWindow(endDate: Date): { start: Date; end: Date } {
    const start = new Date(endDate);
    start.setUTCDate(start.getUTCDate() + 1);

    // 0=Sun … 1=Mon … 6=Sat — advance to Monday when needed
    const day = start.getUTCDay();
    const daysUntilMonday = (1 - day + 7) % 7;
    start.setUTCDate(start.getUTCDate() + daysUntilMonday);
    start.setUTCHours(0, 1, 0, 0);

    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Handle weekly recurring challenge - create new instance each cycle.
   * Self-healing: walks forward from the most recent instance's end_date,
   * creating any missing windows up to ~1 week ahead.
   */
  private async handleWeeklyRecurringChallenge(challenge: Challenge, now: Date): Promise<void> {
    try {
      let cursor = new Date(challenge.end_date);
      const nextWeekCutoff = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const MAX_ITERATIONS = 10;
      let iterations = 0;
      const stepCfg = getStepChallengeConfig(challenge.title);

      while (iterations < MAX_ITERATIONS) {
        iterations++;

        const { start: nextStart, end: nextEnd } = stepCfg
          ? getNextWeekdayDurationWindow(cursor, stepCfg.startWeekday, stepCfg.durationDays)
          : this.getNextMondaySundayWindow(cursor);

        // Stop once we've scheduled up to 1 week in the future
        if (nextStart > nextWeekCutoff) break;

        // Check if an instance already exists for this window (ignore fee — templates may be stale)
        const { data: existing } = await supabase
          .from('challenges')
          .select('id, status')
          .eq('title', challenge.title)
          .eq('is_recurring', true)
          .gte('start_date', nextStart.toISOString())
          .lte('start_date', nextEnd.toISOString());

        if (!existing || existing.length === 0) {
          if (__DEV__) {
            const weeksAgo = Math.round((now.getTime() - nextStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
            const label = weeksAgo > 0 ? `(catch-up: ${weeksAgo}w ago)` : '(next week)';
            console.log(`  ✨ Creating missing instance for "${challenge.title}" ${nextStart.toISOString().split('T')[0]} ${label}`);
          }
          await this.createRecurringInstance({ ...challenge, end_date: cursor.toISOString() });
        }

        cursor = nextEnd;
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
          entry_fee: resolveOfficialEntryFee(originalChallenge),
          verification_type: originalChallenge.verification_type,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          created_by: originalChallenge.created_by,
          status: 'upcoming', // Will become active at 1pm
          image_url: originalChallenge.image_url,
          is_recurring: true,
          recurring_schedule: 'daily',
          is_pro_only: resolveIsProOnly(originalChallenge),
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

    } catch (error) {
      console.error('Error in createDailyRecurringInstance:', error);
    }
  }

  /**
   * Create a new instance of a weekly recurring challenge.
   * Step challenges use custom weekday + duration; others stay Mon–Sun.
   */
  private async createRecurringInstance(originalChallenge: Challenge): Promise<void> {
    try {
      const stepCfg = getStepChallengeConfig(originalChallenge.title);
      const { start: nextWeekStart, end: nextWeekEnd } = stepCfg
        ? getNextWeekdayDurationWindow(
            new Date(originalChallenge.end_date),
            stepCfg.startWeekday,
            stepCfg.durationDays
          )
        : this.getNextMondaySundayWindow(new Date(originalChallenge.end_date));

      const durationWeeks = stepCfg
        ? Math.max(1, Math.ceil(stepCfg.durationDays / 7))
        : originalChallenge.duration_weeks;
      
      // Create new challenge instance for next cycle
      const { data: newChallenge, error: challengeError } = await supabase
        .from('challenges')
        .insert({
          title: originalChallenge.title,
          description: originalChallenge.description,
          category: originalChallenge.category,
          duration_weeks: durationWeeks,
          entry_fee: resolveOfficialEntryFee(originalChallenge),
          verification_type: originalChallenge.verification_type || 'automatic',
          start_date: nextWeekStart.toISOString(),
          end_date: nextWeekEnd.toISOString(),
          created_by: originalChallenge.created_by,
          status: 'upcoming',
          image_url: originalChallenge.image_url,
          is_recurring: true,
          recurring_schedule: originalChallenge.recurring_schedule,
          is_pro_only: resolveIsProOnly(originalChallenge),
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
      await this.validateUserId(userId);

      // Pro users: max 3 active (not-yet-ended) created challenges at a time
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.is_pro) {
        const activeCount = await this.countActiveUserCreatedChallenges(userId);
        if (activeCount >= 3) {
          throw new Error(
            'Pro members can have up to 3 active challenges at a time. Delete or wait for one to end before creating another.'
          );
        }
      }

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
      const { data: challenge, error: findError } = await supabase
        .from('challenges')
        .select('*')
        .eq('join_code', code.toUpperCase())
        .eq('visibility', 'private')
        .single();

      if (findError || !challenge) {
        throw new Error('Invalid join code');
      }

      await this.validateUserId(userId);
      await this.assertCanJoinChallenge(userId, challenge);

      const { data: existing } = await supabase
        .from('challenge_participants')
        .select('id, status')
        .eq('challenge_id', challenge.id)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing?.status === 'active') {
        throw new Error('You have already joined this challenge');
      }

      if (challenge.status !== 'active' && challenge.status !== 'upcoming') {
        throw new Error('Challenge is not open for joining');
      }

      if (challenge.max_participants) {
        const { count } = await supabase
          .from('challenge_participants')
          .select('*', { count: 'exact', head: true })
          .eq('challenge_id', challenge.id)
          .eq('status', 'active');

        if (count && count >= challenge.max_participants) {
          throw new Error('Challenge is full');
        }
      }

      const entryFee = Number(challenge.entry_fee) || 0;

      if (entryFee > 0) {
        const balance = await walletService.getBalance(userId);
        if (balance < entryFee) {
          const shortfallError = new Error(
            `Insufficient wallet balance. Entry is £${entryFee.toFixed(2)}; you have £${balance.toFixed(2)}.`
          ) as Error & {
            code: string;
            entryFee: number;
            balance: number;
            shortBy: number;
          };
          shortfallError.code = 'INSUFFICIENT_WALLET_BALANCE';
          shortfallError.entryFee = entryFee;
          shortfallError.balance = balance;
          shortfallError.shortBy = Math.max(
            0.01,
            Math.ceil((entryFee - balance) * 100) / 100
          );
          throw shortfallError;
        }

        const { paymentIntentId } = await this.initiateChallengeJoinWithWallet(
          challenge.id,
          userId,
          entryFee
        );
        await this.completeChallengeJoin(challenge.id, userId, paymentIntentId);
      } else {
        await this.completeChallengeJoin(challenge.id, userId, null);
      }

      apiCache.delete(apiCache.generateKey('challenges', 'all'));
      apiCache.delete(apiCache.generateKey('challenges', 'active'));
      apiCache.delete(apiCache.generateKey('challenges', 'upcoming'));

      return challenge as Challenge;
    } catch (error) {
      console.error('Error joining challenge by code:', error);
      throw error;
    }
  }

  /**
   * Get challenges created by user
   */
  async getUserCreatedChallenges(userId: string): Promise<Challenge[]> {
    // Validate user ID matches authenticated user
    await this.validateUserId(userId);
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
   * Delete user challenge (only before it has started).
   */
  async deleteUserChallenge(challengeId: string, userId: string): Promise<void> {
    try {
      await this.validateUserId(userId);

      const { data: challenge, error: fetchError } = await supabase
        .from('challenges')
        .select('id, start_date, created_by, is_user_created')
        .eq('id', challengeId)
        .eq('created_by', userId)
        .eq('is_user_created', true)
        .single();

      if (fetchError || !challenge) {
        throw new Error('Challenge not found');
      }

      if (challenge.start_date && new Date() >= new Date(challenge.start_date)) {
        throw new Error(
          'This challenge has already started and can no longer be deleted.'
        );
      }

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

  /** How many of the user's created challenges are still active / not ended. */
  async countActiveUserCreatedChallenges(userId: string): Promise<number> {
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('challenges')
        .select('id')
        .eq('created_by', userId)
        .eq('is_user_created', true)
        .in('status', ['active', 'upcoming'])
        .gte('end_date', nowIso);

      if (error) {
        console.error('Error counting active user challenges:', error);
        return 0;
      }
      return data?.length ?? 0;
    } catch (error) {
      console.error('Error in countActiveUserCreatedChallenges:', error);
      return 0;
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
   * For every active participant in a completed challenge, recalculate their
   * completion percentage based on actual days submitted vs total challenge days,
   * then mark them 'completed' (100 %) or 'failed' (< 100 %) accordingly.
   *
   * This must be called before distributePot so the winner filter is accurate.
   */
  private async finaliseParticipantStatuses(challengeId: string): Promise<void> {
    try {
      // Get challenge dates so we know the total number of required days
      const { data: challengeData, error: cErr } = await supabase
        .from('challenges')
        .select('start_date, end_date')
        .eq('id', challengeId)
        .single();

      if (cErr || !challengeData) {
        console.error(`finaliseParticipantStatuses: cannot load challenge ${challengeId}`, cErr);
        return;
      }

      const startDate = new Date(challengeData.start_date);
      const endDate = new Date(challengeData.end_date);
      // Total days inclusive (e.g. start = end → 1 day)
      const totalDays = Math.max(
        1,
        Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      );

      // Get all still-active participants (completed ones are already correct)
      const { data: participants, error: pErr } = await supabase
        .from('challenge_participants')
        .select('id, user_id, status')
        .eq('challenge_id', challengeId)
        .in('status', ['active', 'completed']);

      if (pErr || !participants) {
        console.error(`finaliseParticipantStatuses: cannot load participants`, pErr);
        return;
      }

      for (const p of participants) {
        // Count distinct submission_date values for this participant
        const { count, error: sErr } = await supabase
          .from('challenge_submissions')
          .select('submission_date', { count: 'exact', head: true })
          .eq('challenge_id', challengeId)
          .eq('user_id', p.user_id)
          .not('submission_date', 'is', null);

        if (sErr) {
          console.error(`finaliseParticipantStatuses: error counting submissions for ${p.user_id}`, sErr);
          continue;
        }

        const submittedDays = count ?? 0;
        const pct = Math.min(100, Math.round((submittedDays / totalDays) * 100));
        const newStatus = pct >= 100 ? 'completed' : 'failed';

        if (p.status !== newStatus || pct !== 100) {
          await supabase
            .from('challenge_participants')
            .update({ completion_percentage: pct, status: newStatus })
            .eq('id', p.id);
        }
      }

      if (__DEV__) {
        console.log(`✅ finaliseParticipantStatuses: processed ${participants.length} participants for challenge ${challengeId} (totalDays=${totalDays})`);
      }
    } catch (err) {
      console.error('Error in finaliseParticipantStatuses:', err);
      // Non-fatal — distributePot will still run
    }
  }

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

      // Find ended challenges that still need closing:
      // - approval_status IS NULL (never processed), OR
      // - stuck as pending with no flagged submissions (should have auto-approved)
      const { data: endedChallenges, error } = await supabase
        .from('challenges')
        .select('id, title, end_date, status, approval_status')
        .lt('end_date', gracePeriodISO)
        .or('approval_status.is.null,approval_status.eq.pending')
        .in('status', ['upcoming', 'active', 'completed']);

      if (error) {
        console.error('Error fetching ended challenges:', error);
        return;
      }

      if (!endedChallenges || endedChallenges.length === 0) {
        return;
      }


      for (const challenge of endedChallenges) {
        try {
          // Check whether any submission in this challenge has been flagged
          const { data: flaggedRows, error: flagError } = await supabase
            .from('challenge_submissions')
            .select('id')
            .eq('challenge_id', challenge.id)
            .eq('is_flagged', true)
            .limit(1);

          if (flagError) {
            console.error(`Error checking flags for challenge ${challenge.id}:`, flagError);
            // Don't dump everything into admin review on query failure
            continue;
          }

          const hasFlaggedSubmissions = (flaggedRows?.length ?? 0) > 0;

          // Already pending with real flags → leave for admin
          if (challenge.approval_status === 'pending' && hasFlaggedSubmissions) {
            continue;
          }

          // Always finalise participant statuses first (marks non-completers as 'failed')
          await this.finaliseParticipantStatuses(challenge.id);

          // Skip admin review if nobody joined
          const { count: participantCount } = await supabase
            .from('challenge_participants')
            .select('id', { count: 'exact', head: true })
            .eq('challenge_id', challenge.id);

          if (!participantCount || participantCount === 0) {
            await supabase
              .from('challenges')
              .update({
                approval_status: 'approved',
                status: 'completed',
                reviewed_at: new Date().toISOString(),
                admin_notes: 'Auto-approved: no participants',
              })
              .eq('id', challenge.id);
            continue;
          }

          if (hasFlaggedSubmissions) {
            // Flagged submissions present → send to admin review
            if (__DEV__) {
              console.log(`⚠️ Challenge ${challenge.id} (${challenge.title}) has flagged submissions — routing to admin review`);
            }
            await this.markChallengeAsPendingReview(challenge.id);
          } else {
            // No flags → auto-approve and distribute immediately
            if (__DEV__) {
              console.log(`✅ Challenge ${challenge.id} (${challenge.title}) has no flags — auto-approving`);
            }
            const { error: approveError } = await supabase
              .from('challenges')
              .update({
                approval_status: 'approved',
                status: 'completed',
                reviewed_at: new Date().toISOString(),
                admin_notes: 'Auto-approved: no flagged submissions',
              })
              .eq('id', challenge.id);

            if (approveError) {
              console.error(`Error auto-approving challenge ${challenge.id}:`, approveError);
              // Fall back to pending so admin can handle it
              await this.markChallengeAsPendingReview(challenge.id);
              continue;
            }

            // Distribute pot to winners (free challenges skipped inside distributePot)
            try {
              await challengePotService.distributePot(challenge.id, true);
            } catch (distErr) {
              console.error(`Error distributing pot for auto-approved challenge ${challenge.id}:`, distErr);
              // Challenge is already approved in DB — pot distribution can be retried by processCompletedChallenges
            }
          }
        } catch (error) {
          console.error(`Error processing ended challenge ${challenge.id} (${challenge.title}):`, error);
        }
      }
    } catch (error) {
      console.error('Error in checkAndUpdateEndedChallenges:', error);
    } finally {
      this.isCheckingEndedChallenges = false;
    }
  }

  // ─── Community Submission Flagging ───────────────────────────────────────

  /**
   * Flag a submission. Inserts a flag row and increments the denormalised
   * flag_count / is_flagged columns on challenge_submissions.
   * RLS prevents users from flagging their own submissions.
   */
  async flagSubmission(submissionId: string, userId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error: insertError } = await supabase
        .from('challenge_submission_flags')
        .insert({ submission_id: submissionId, flagged_by: userId, reason: reason ?? null });

      if (insertError) {
        if (insertError.code === '23505') {
          return { success: false, error: 'already_flagged' };
        }
        return { success: false, error: insertError.message };
      }

      // Increment denormalised counters
      await supabase.rpc('increment_submission_flag_count', { submission_id_param: submissionId });

      return { success: true };
    } catch (error: any) {
      console.error('Error flagging submission:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove a previously placed flag. Decrements counters and clears
   * is_flagged if flag_count drops to zero.
   */
  async unflagSubmission(submissionId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error: deleteError } = await supabase
        .from('challenge_submission_flags')
        .delete()
        .eq('submission_id', submissionId)
        .eq('flagged_by', userId);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      // Decrement counters
      await supabase.rpc('decrement_submission_flag_count', { submission_id_param: submissionId });

      return { success: true };
    } catch (error: any) {
      console.error('Error unflagging submission:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch all submissions for every participant in a challenge, along with
   * the current user's flag state for each submission.
   * Returns a map of userId → submissions[].
   */
  async getParticipantSubmissions(
    challengeId: string,
    currentUserId: string
  ): Promise<Record<string, import('../types/challenges').ChallengeSubmission[]>> {
    try {
      const { data: submissions, error } = await supabase
        .from('challenge_submissions')
        .select('id, challenge_id, user_id, photo_url, submitted_at, submission_date, week_number, verification_status, submission_notes, is_flagged, flag_count')
        .eq('challenge_id', challengeId)
        .order('submitted_at', { ascending: false });

      if (error || !submissions) return {};

      // Fetch this user's own flags for the returned submissions in one query
      const submissionIds = submissions.map((s: any) => s.id);
      let myFlagSet = new Set<string>();
      if (submissionIds.length > 0) {
        const { data: myFlags } = await supabase
          .from('challenge_submission_flags')
          .select('submission_id')
          .eq('flagged_by', currentUserId)
          .in('submission_id', submissionIds);
        if (myFlags) {
          myFlagSet = new Set(myFlags.map((f: any) => f.submission_id));
        }
      }

      const result: Record<string, import('../types/challenges').ChallengeSubmission[]> = {};
      for (const s of submissions) {
        const enriched = { ...s, has_flagged_by_me: myFlagSet.has(s.id) };
        if (!result[s.user_id]) result[s.user_id] = [];
        result[s.user_id].push(enriched);
      }
      return result;
    } catch (error: any) {
      console.error('Error loading participant submissions:', error);
      return {};
    }
  }
}

export const challengesService = new ChallengesService();
