import { supabase } from './supabase';
import { challengePotService } from './challengePotService';
import { notificationService } from './notificationService';
import { Challenge, ChallengeReviewData, ParticipantWithSubmissions } from '../types/challenges';

class AdminService {
  /**
   * Check if user is an admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        // If table doesn't exist or RLS blocks, return false
        if (error.code === '42P01' || error.code === 'PGRST301') {
          console.log('Admin table does not exist or RLS blocked access');
          return false;
        }
        // If no rows found (PGRST116), user is not admin
        if (error.code === 'PGRST116') {
          return false;
        }
        console.log('Admin check error:', error.code, error.message);
        return false;
      }

      if (!data) {
        return false;
      }

      return true;
    } catch (error: any) {
      // Handle case where table doesn't exist
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        console.log('Admin table does not exist');
        return false;
      }
      console.error('Error checking admin status:', error);
      return false;
    }
  }

  /**
   * Get pending challenges that need review
   */
  async getPendingChallenges(filters?: { limit?: number; offset?: number }): Promise<Challenge[]> {
    try {
      // Only show challenges that have actually ended (end_date is in the past)
      // Add 1 hour grace period to prevent marking challenges that just ended
      const now = new Date();
      const gracePeriod = new Date(now.getTime() - (1 * 60 * 60 * 1000)); // 1 hour ago
      const gracePeriodISO = gracePeriod.toISOString();

      let query = supabase
        .from('challenges')
        .select('*')
        .eq('approval_status', 'pending')
        .eq('status', 'completed')
        .lt('end_date', gracePeriodISO) // Only challenges that ended more than 1 hour ago
        .order('end_date', { ascending: false });

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      if (filters?.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching pending challenges:', error);
        throw error;
      }

      console.log(`📋 [getPendingChallenges] Found ${data?.length || 0} pending challenges for review (ended before ${gracePeriodISO})`);
      if (data && data.length > 0) {
        // Log first few challenge IDs and their approval_status for debugging
        const sample = data.slice(0, 5).map(c => ({ 
          id: c.id.substring(0, 8) + '...', 
          approval_status: c.approval_status, 
          status: c.status,
          end_date: c.end_date
        }));
        console.log(`📋 [getPendingChallenges] Sample pending challenges:`, sample);
      }

      // Get participant counts for all challenges
      if (data && data.length > 0) {
        const challengeIds = data.map(c => c.id);
        const { data: participantCounts, error: countError } = await supabase
          .from('challenge_participants')
          .select('challenge_id')
          .in('challenge_id', challengeIds);

        if (countError) {
          console.error('Error getting participant counts:', countError);
        }

        const countMap = new Map<string, number>();
        if (participantCounts) {
          participantCounts.forEach((p: any) => {
            const current = countMap.get(p.challenge_id) || 0;
            countMap.set(p.challenge_id, current + 1);
          });
        }

        return data.map(challenge => ({
          ...challenge,
          participant_count: countMap.get(challenge.id) || 0,
        }));
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPendingChallenges:', error);
      throw error;
    }
  }

  /**
   * Get detailed challenge review data including all participants and submissions
   */
  async getChallengeReviewData(challengeId: string): Promise<ChallengeReviewData | null> {
    try {
      // Get challenge details
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challengeError || !challenge) {
        console.error('Error fetching challenge:', challengeError);
        return null;
      }

      // Get all participants
      const { data: participants, error: participantsError } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        throw participantsError;
      }

      console.log(`[getChallengeReviewData] Found ${participants?.length || 0} participants for challenge ${challengeId}`);
      if (participants && participants.length > 0) {
        console.log('[getChallengeReviewData] Participant IDs:', participants.map(p => ({ id: p.id, user_id: p.user_id, status: p.status })));
      }

      // Get all submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('challenge_submissions')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('submitted_at', { ascending: false });

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
        throw submissionsError;
      }

      // Get user profiles for participants
      const userIds = [...new Set(participants?.map(p => p.user_id) || [])];
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

      // Group submissions by user
      const submissionsByUser = new Map<string, typeof submissions>();
      (submissions || []).forEach(submission => {
        const userSubmissions = submissionsByUser.get(submission.user_id) || [];
        userSubmissions.push(submission);
        submissionsByUser.set(submission.user_id, userSubmissions);
      });

      // Build participants with submissions
      // A participant is considered invalid if:
      // 1. They have been explicitly marked as invalid (is_invalid = true), OR
      // 2. They have 0% completion (no submissions/effort)
      const participantsWithSubmissions: ParticipantWithSubmissions[] = (participants || []).map(participant => {
        const user = profilesMap.get(participant.user_id);
        const userSubmissions = submissionsByUser.get(participant.user_id) || [];
        const completionPercentage = participant.completion_percentage || 0;
        const isExplicitlyInvalid = participant.is_invalid || false;
        const hasZeroCompletion = completionPercentage === 0;
        // Consider invalid if explicitly marked OR has 0% completion
        const isInvalid = isExplicitlyInvalid || hasZeroCompletion;
        
        return {
          participant,
          user: user || {
            id: participant.user_id,
            username: 'Unknown',
          },
          submissions: userSubmissions,
          completionPercentage,
          isInvalid,
        };
      });

      // Calculate completion stats
      // A participant is considered invalid if:
      // 1. They have been explicitly marked as invalid (is_invalid = true), OR
      // 2. They have 0% completion (no submissions/effort)
      const totalParticipants = participants?.length || 0;
      const validParticipants = participants?.filter(p => {
        const isExplicitlyInvalid = p.is_invalid || false;
        const hasZeroCompletion = (p.completion_percentage || 0) === 0;
        return !isExplicitlyInvalid && !hasZeroCompletion;
      }).length || 0;
      const invalidParticipants = participants?.filter(p => {
        const isExplicitlyInvalid = p.is_invalid || false;
        const hasZeroCompletion = (p.completion_percentage || 0) === 0;
        return isExplicitlyInvalid || hasZeroCompletion;
      }).length || 0;
      const completedCount = participants?.filter(p => p.status === 'completed').length || 0;
      const failedCount = participants?.filter(p => p.status === 'failed').length || 0;
      const averageCompletion = participants && participants.length > 0
        ? participants.reduce((sum, p) => sum + (p.completion_percentage || 0), 0) / participants.length
        : 0;

      return {
        challenge: challenge as Challenge,
        participants: participantsWithSubmissions,
        completionStats: {
          totalParticipants,
          validParticipants,
          invalidParticipants,
          completedCount,
          failedCount,
          averageCompletion: Math.round(averageCompletion * 100) / 100,
        },
      };
    } catch (error) {
      console.error('Error in getChallengeReviewData:', error);
      throw error;
    }
  }

  /**
   * Verify all participants and approve challenge
   */
  async verifyAllParticipants(challengeId: string, adminId: string, notes?: string): Promise<boolean> {
    try {
      // Verify admin status
      const isAdmin = await this.isAdmin(adminId);
      if (!isAdmin) {
        throw new Error('User is not an admin');
      }

      // Get challenge to check if it has an entry fee
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('entry_fee')
        .eq('id', challengeId)
        .single();

      if (challengeError) {
        console.error('Error fetching challenge:', challengeError);
        throw challengeError;
      }

      // Update challenge approval status
      console.log(`🔄 [verifyAllParticipants] Updating challenge ${challengeId} approval_status to 'approved'`);
      const { data: updatedChallenge, error: updateError } = await supabase
        .from('challenges')
        .update({
          approval_status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes || null,
        })
        .eq('id', challengeId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ [verifyAllParticipants] Error approving challenge:', updateError);
        console.error('   Error details:', JSON.stringify(updateError, null, 2));
        throw updateError;
      }

      if (updatedChallenge) {
        console.log(`✅ [verifyAllParticipants] Challenge ${challengeId} updated successfully`);
        console.log(`   - approval_status: ${updatedChallenge.approval_status}`);
        console.log(`   - status: ${updatedChallenge.status}`);
      } else {
        console.warn(`⚠️ [verifyAllParticipants] Challenge ${challengeId} update returned no data`);
      }

      // Only distribute pot if challenge has an entry fee
      if (challenge.entry_fee && challenge.entry_fee > 0) {
        // Distribute pot to winners (excludes invalid users automatically)
        // Skip approval check since we're in the approval process
        await challengePotService.distributePot(challengeId, true);
      } else {
        console.log('✅ Free challenge approved (no pot to distribute)');
      }

      // Create notifications for all participants
      const { data: participants } = await supabase
        .from('challenge_participants')
        .select('user_id')
        .eq('challenge_id', challengeId);

      if (participants) {
        const { data: challenge } = await supabase
          .from('challenges')
          .select('title')
          .eq('id', challengeId)
          .single();

        const title = challenge?.title || 'Challenge';
        for (const participant of participants) {
          await notificationService.createNotification(
            {
              user_id: participant.user_id,
              notification_type: 'challenge_approved',
            },
            { title: '🏆 Challenge Approved', body: `Your "${title}" challenge was approved! Check your wallet.` }
          );
        }
      }

      console.log('✅ Challenge approved and pot distributed:', challengeId);
      return true;
    } catch (error) {
      console.error('Error in verifyAllParticipants:', error);
      throw error;
    }
  }

  /**
   * Invalidate a specific user's submission
   */
  async invalidateUserSubmission(
    challengeId: string,
    userId: string,
    adminId: string,
    reason: string
  ): Promise<boolean> {
    try {
      // Verify admin status
      const isAdmin = await this.isAdmin(adminId);
      if (!isAdmin) {
        throw new Error('User is not an admin');
      }

      // Update participant record
      const { error: updateError } = await supabase
        .from('challenge_participants')
        .update({
          is_invalid: true,
          invalidated_by: adminId,
          invalidated_at: new Date().toISOString(),
          invalidation_reason: reason,
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error invalidating user submission:', updateError);
        throw updateError;
      }

      await notificationService.createNotification(
        {
          user_id: userId,
          notification_type: 'submission_invalidated',
        },
        { title: '⚠️ Submission Invalidated', body: 'One of your challenge submissions was invalidated.' }
      );

      console.log('✅ User submission invalidated:', { challengeId, userId, reason });
      return true;
    } catch (error) {
      console.error('Error in invalidateUserSubmission:', error);
      throw error;
    }
  }

  /**
   * Approve challenge after invalidating some users
   */
  async approveChallengeAfterInvalidation(challengeId: string, adminId: string, notes?: string): Promise<boolean> {
    try {
      // Verify admin status
      const isAdmin = await this.isAdmin(adminId);
      if (!isAdmin) {
        throw new Error('User is not an admin');
      }

      // Get challenge to check if it has an entry fee
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('entry_fee')
        .eq('id', challengeId)
        .single();

      if (challengeError) {
        console.error('Error fetching challenge:', challengeError);
        throw challengeError;
      }

      // Update challenge approval status
      const { error: updateError } = await supabase
        .from('challenges')
        .update({
          approval_status: 'approved',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes || null,
        })
        .eq('id', challengeId);

      if (updateError) {
        console.error('Error approving challenge:', updateError);
        throw updateError;
      }

      // Only distribute pot if challenge has an entry fee
      if (challenge.entry_fee && challenge.entry_fee > 0) {
        // Distribute pot (will exclude invalid users)
        // Skip approval check since we're in the approval process
        await challengePotService.distributePot(challengeId, true);
      } else {
        console.log('✅ Free challenge approved (no pot to distribute)');
      }

      // Create notifications for all valid participants
      const { data: participants } = await supabase
        .from('challenge_participants')
        .select('user_id')
        .eq('challenge_id', challengeId)
        .eq('is_invalid', false);

      if (participants) {
        const { data: ch } = await supabase.from('challenges').select('title').eq('id', challengeId).single();
        const chTitle = ch?.title || 'Challenge';
        for (const participant of participants) {
          await notificationService.createNotification(
            {
              user_id: participant.user_id,
              notification_type: 'challenge_approved',
            },
            { title: '🏆 Challenge Approved', body: `Your "${chTitle}" challenge was approved! Check your wallet.` }
          );
        }
      }

      console.log('✅ Challenge approved after invalidation:', challengeId);
      return true;
    } catch (error) {
      console.error('Error in approveChallengeAfterInvalidation:', error);
      throw error;
    }
  }

  /**
   * Reject challenge (two-step process)
   * First call stores rejection intent, second call confirms
   */
  private rejectionIntents = new Map<string, { adminId: string; timestamp: number }>();

  async rejectChallenge(
    challengeId: string,
    adminId: string,
    reason: string,
    isFirstStep: boolean = false
  ): Promise<boolean> {
    try {
      // Verify admin status
      const isAdmin = await this.isAdmin(adminId);
      if (!isAdmin) {
        throw new Error('User is not an admin');
      }

      if (isFirstStep) {
        // Store rejection intent (expires after 5 minutes)
        this.rejectionIntents.set(challengeId, {
          adminId,
          timestamp: Date.now(),
        });
        return true;
      }

      // Check if rejection intent exists and is recent (within 5 minutes)
      const intent = this.rejectionIntents.get(challengeId);
      if (!intent || intent.adminId !== adminId) {
        throw new Error('Rejection intent not found or expired. Please start the rejection process again.');
      }

      const fiveMinutes = 5 * 60 * 1000;
      if (Date.now() - intent.timestamp > fiveMinutes) {
        this.rejectionIntents.delete(challengeId);
        throw new Error('Rejection intent expired. Please start the rejection process again.');
      }

      // Update challenge approval status
      const { error: updateError } = await supabase
        .from('challenges')
        .update({
          approval_status: 'rejected',
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', challengeId);

      if (updateError) {
        console.error('Error rejecting challenge:', updateError);
        throw updateError;
      }

      // Clear rejection intent
      this.rejectionIntents.delete(challengeId);

      // Create notifications for all participants
      const { data: participants } = await supabase
        .from('challenge_participants')
        .select('user_id')
        .eq('challenge_id', challengeId);

      if (participants) {
        const { data: ch } = await supabase.from('challenges').select('title').eq('id', challengeId).single();
        const chTitle = ch?.title || 'Challenge';
        for (const participant of participants) {
          await notificationService.createNotification(
            {
              user_id: participant.user_id,
              notification_type: 'challenge_rejected',
            },
            { title: '❌ Challenge Rejected', body: `Your "${chTitle}" challenge was not approved.` }
          );
        }
      }

      console.log('✅ Challenge rejected:', challengeId);
      return true;
    } catch (error) {
      console.error('Error in rejectChallenge:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();

