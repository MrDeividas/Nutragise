import { supabase } from './supabase';
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

      // Get participant counts for each challenge separately
      let challenges = await Promise.all(
        (data || []).map(async (challenge) => {
          const { count, error: countError } = await supabase
            .from('challenge_participants')
            .select('*', { count: 'exact', head: true })
            .eq('challenge_id', challenge.id);
          
          if (countError) {
            console.error(`Error getting participant count for challenge ${challenge.id}:`, countError);
          }
          
          return {
            ...challenge,
            participant_count: count || 0,
          };
        })
      );

      // Filter recurring challenges to only show current week's instances
      const now = new Date();
      const filteredChallenges: Challenge[] = [];
      const recurringTitles = new Set<string>();

      for (const challenge of challenges) {
        
        if (challenge.is_recurring) {
          // For recurring challenges, only show the current week's instance
          const challengeStart = new Date(challenge.start_date);
          const challengeEnd = new Date(challenge.end_date);
          
          // If end date is set to midnight (00:00), it's actually the end of the previous day
          // So we need to set it to the end of that day (23:59:59.999)
          if (challengeEnd.getUTCHours() === 0 && challengeEnd.getUTCMinutes() === 0 && challengeEnd.getUTCSeconds() === 0) {
            challengeEnd.setUTCHours(23, 59, 59, 999);
          }
          
          // Check if this challenge is currently active OR upcoming within the next week
          const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          
          const isActive = (now >= challengeStart && now <= challengeEnd);
          const isUpcoming = (now < challengeStart && challengeStart <= oneWeekFromNow);
          const isRecentlyEnded = (now > challengeEnd && now <= oneWeekFromNow);
          
          // Show if active, upcoming, or recently ended (to bridge gaps)
          if (isActive || isUpcoming || isRecentlyEnded) {
            // Only add if we haven't already added a challenge with this title
            if (!recurringTitles.has(challenge.title)) {
              filteredChallenges.push(challenge);
              recurringTitles.add(challenge.title);
            }
          }
        } else {
          // Non-recurring challenges are added as normal
          filteredChallenges.push(challenge);
        }
      }

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
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', id)
        .single();

      if (challengeError) {
        console.error('Error fetching challenge:', challengeError);
        throw challengeError;
      }

      if (!challenge) return null;

      // Get requirements
      const { data: requirements, error: requirementsError } = await supabase
        .from('challenge_requirements')
        .select('*')
        .eq('challenge_id', id)
        .order('requirement_order');

      if (requirementsError) {
        console.error('Error fetching requirements:', requirementsError);
      }

      // Get participants
      const { data: participants, error: participantsError } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', id);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
      }

      // Get user profiles for participants
      let participantsWithProfiles = [];
      if (participants && participants.length > 0) {
        const userIds = participants.map(p => p.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, display_name')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching participant profiles:', profilesError);
        }

        // Combine participants with their profile data
        participantsWithProfiles = participants.map(participant => ({
          ...participant,
          user: profiles?.find(profile => profile.id === participant.user_id)
        }));
      }

      // Get creator info
      const { data: creator, error: creatorError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, display_name')
        .eq('id', challenge.created_by)
        .single();

      if (creatorError) {
        console.error('Error fetching creator:', creatorError);
      }

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
   * Join a challenge
   */
  async joinChallenge(challengeId: string, userId: string): Promise<boolean> {
    try {
      // Check if user is already participating
      const { data: existing } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        return false;
      }

      // Check if challenge is still open for joining
      const { data: challenge } = await supabase
        .from('challenges')
        .select('status, start_date, max_participants')
        .eq('id', challengeId)
        .single();

      if (!challenge) {
        throw new Error('Challenge not found');
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

      // TODO: Future Stripe integration - collect payment here
      // const paymentResult = await this.processPayment(challenge.entry_fee, userId);

      const { error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: userId,
          status: 'active',
          payment_status: 'paid', // For now, assume free challenges are "paid"
        });

      if (error) {
        console.error('Error joining challenge:', error);
        throw error;
      }

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
        .select('start_date, status')
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

      const { error } = await supabase
        .from('challenge_participants')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error leaving challenge:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in leaveChallenge:', error);
      throw error;
    }
  }

  /**
   * Get user's active challenges
   */
  async getUserChallenges(userId: string): Promise<Challenge[]> {
    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select(`
          challenge:challenges!inner(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching user challenges:', error);
        throw error;
      }

      return data?.map(item => item.challenge) || [];
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
      } else {
        // Create new submission
        const { error } = await supabase
          .from('challenge_submissions')
          .insert({
            challenge_id: challengeId,
            user_id: userId,
            photo_url: photoUrl,
            week_number: weekNumber,
            submission_notes: submissionNotes,
            verification_status: 'pending',
          });

        if (error) {
          console.error('Error creating submission:', error);
          throw error;
        }
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

      const { error } = await supabase
        .from('challenge_participants')
        .update({ completion_percentage: progress.completion_percentage })
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
   */
  async isUserParticipating(challengeId: string, userId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .single();

      return !!data;
    } catch (error) {
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
      // Get all recurring challenges that need a new instance
      const { data: recurringChallenges, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_recurring', true)
        .eq('status', 'active')
        .not('next_recurrence', 'is', null);

      if (error) {
        console.error('Error fetching recurring challenges:', error);
        return;
      }

      const now = new Date();

      for (const challenge of recurringChallenges || []) {
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
          const { data: existingChallenge } = await supabase
            .from('challenges')
            .select('id')
            .eq('title', challenge.title)
            .eq('is_recurring', true)
            .gte('start_date', nextWeekStart.toISOString())
            .lte('end_date', nextWeekEnd.toISOString())
            .single();

          // Only create if no challenge exists for next week
          if (!existingChallenge) {
            await this.createRecurringInstance(challenge);
          }
        }
      }
    } catch (error) {
      console.error('Error handling recurring challenges:', error);
    }
  }

  /**
   * Create a new instance of a recurring challenge
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
   * Future Stripe integration - redistribute pot when challenge ends
   */
  async redistributePot(challengeId: string): Promise<void> {
    // TODO: Implement Stripe integration
    // 1. Get all participants who completed the challenge
    // 2. Calculate total pot
    // 3. Distribute pot among successful participants
    // 4. Process refunds for failed participants
    console.log('TODO: Implement Stripe pot redistribution for challenge:', challengeId);
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
}

export const challengesService = new ChallengesService();
