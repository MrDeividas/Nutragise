import { supabase } from './supabase';
import { challengePotService } from './challengePotService';
import { notificationService } from './notificationService';
import { Challenge, ChallengeReviewData, ParticipantWithSubmissions } from '../types/challenges';

export type ContentReportItem = {
  id: string;
  reporter_id: string;
  reported_user_id?: string | null;
  post_id?: string | null;
  post_source?: 'posts' | 'daily_posts' | null;
  reason: string;
  created_at: string;
  review_status: string;
  reporter?: {
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  } | null;
  reportedUser?: {
    id: string;
    username?: string;
    display_name?: string;
    avatar_url?: string;
  } | null;
  postPreview?: {
    id: string;
    content: string;
    photoUrl: string | null;
    userId: string;
  } | null;
};

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
   * Get pending challenges that need review.
   * Only includes challenges that:
   * - have ended (with grace period)
   * - have at least one participant
   * - have at least one flagged submission
   */
  async getPendingChallenges(filters?: { limit?: number; offset?: number }): Promise<Challenge[]> {
    try {
      const now = new Date();
      const gracePeriod = new Date(now.getTime() - (1 * 60 * 60 * 1000));
      const gracePeriodISO = gracePeriod.toISOString();

      let query = supabase
        .from('challenges')
        .select('*')
        .eq('approval_status', 'pending')
        .eq('status', 'completed')
        .lt('end_date', gracePeriodISO)
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

      if (!data || data.length === 0) {
        return [];
      }

      const challengeIds = data.map((c) => c.id);

      const [{ data: participantCounts, error: countError }, { data: flaggedRows, error: flagError }] =
        await Promise.all([
          supabase
            .from('challenge_participants')
            .select('challenge_id')
            .in('challenge_id', challengeIds),
          supabase
            .from('challenge_submissions')
            .select('challenge_id')
            .in('challenge_id', challengeIds)
            .eq('is_flagged', true),
        ]);

      if (countError) {
        console.error('Error getting participant counts:', countError);
      }
      if (flagError) {
        console.error('Error getting flagged submissions:', flagError);
      }

      const countMap = new Map<string, number>();
      (participantCounts || []).forEach((p: any) => {
        countMap.set(p.challenge_id, (countMap.get(p.challenge_id) || 0) + 1);
      });

      const flaggedSet = new Set((flaggedRows || []).map((r: any) => r.challenge_id));

      return data
        .map((challenge) => ({
          ...challenge,
          participant_count: countMap.get(challenge.id) || 0,
        }))
        .filter(
          (challenge) =>
            (challenge.participant_count || 0) > 0 && flaggedSet.has(challenge.id)
        );
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

  /**
   * Pending community content reports (flagged posts / users).
   */
  async getPendingContentReports(limit = 50): Promise<ContentReportItem[]> {
    const { data: reports, error } = await supabase
      .from('content_reports')
      .select('*')
      .eq('review_status', 'pending')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching content reports:', error);
      throw error;
    }

    if (!reports || reports.length === 0) return [];

    const userIds = [
      ...new Set(
        reports
          .flatMap((r) => [r.reporter_id, r.reported_user_id])
          .filter(Boolean) as string[]
      ),
    ];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    const postIdsBySource = {
      posts: reports.filter((r) => r.post_source === 'posts' && r.post_id).map((r) => r.post_id as string),
      daily_posts: reports
        .filter((r) => r.post_source === 'daily_posts' && r.post_id)
        .map((r) => r.post_id as string),
    };

    const [postsRes, dailyRes] = await Promise.all([
      postIdsBySource.posts.length
        ? supabase.from('posts').select('id, content, photos, user_id').in('id', postIdsBySource.posts)
        : Promise.resolve({ data: [] as any[] }),
      postIdsBySource.daily_posts.length
        ? supabase
            .from('daily_posts')
            .select('id, captions, photos, user_id')
            .in('id', postIdsBySource.daily_posts)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const postMap = new Map<string, any>();
    (postsRes.data || []).forEach((p) => postMap.set(`posts:${p.id}`, p));
    (dailyRes.data || []).forEach((p) => postMap.set(`daily_posts:${p.id}`, p));

    return reports.map((report) => {
      const postKey = report.post_source && report.post_id ? `${report.post_source}:${report.post_id}` : null;
      const post = postKey ? postMap.get(postKey) : null;
      const photo =
        post?.photos?.find((uri: string) => /^https?:\/\//i.test(uri || '')) ||
        post?.photos?.[0] ||
        null;
      const content =
        post?.content ||
        (Array.isArray(post?.captions) ? post.captions[0] : '') ||
        '';

      return {
        ...report,
        reporter: profileMap.get(report.reporter_id) || null,
        reportedUser: report.reported_user_id
          ? profileMap.get(report.reported_user_id) || null
          : null,
        postPreview: post
          ? {
              id: post.id,
              content,
              photoUrl: photo,
              userId: post.user_id,
            }
          : null,
      } as ContentReportItem;
    });
  }

  async resolveContentReport(
    reportId: string,
    adminId: string,
    status: 'dismissed' | 'actioned',
    notes?: string
  ): Promise<void> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) throw new Error('User is not an admin');

    const { error } = await supabase
      .from('content_reports')
      .update({
        review_status: status,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes || null,
      })
      .eq('id', reportId);

    if (error) throw error;
  }

  /**
   * Delete a reported community post (posts or daily_posts), then mark report actioned.
   */
  async deleteReportedPost(report: ContentReportItem, adminId: string): Promise<void> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) throw new Error('User is not an admin');

    if (!report.post_id || !report.post_source) {
      throw new Error('No post linked to this report');
    }

    const table = report.post_source === 'daily_posts' ? 'daily_posts' : 'posts';
    const { error } = await supabase.from(table).delete().eq('id', report.post_id);
    if (error) throw error;

    await this.resolveContentReport(report.id, adminId, 'actioned', 'Post deleted by admin');
  }

  /**
   * Send an in-app + push warning to the reported user, then mark report actioned.
   */
  async warnReportedUser(
    report: ContentReportItem,
    adminId: string,
    message: string
  ): Promise<void> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) throw new Error('User is not an admin');

    const targetUserId = report.reported_user_id || report.postPreview?.userId;
    if (!targetUserId) {
      throw new Error('No user to warn for this report');
    }

    const warning =
      message.trim() ||
      'Your recent post was reported and reviewed. Please keep community content respectful.';

    const ok = await notificationService.createNotification(
      {
        user_id: targetUserId,
        from_user_id: adminId,
        notification_type: 'admin_warning',
        post_id: report.post_source === 'posts' ? report.post_id || undefined : undefined,
        habit_type: 'community_warning',
        message: warning,
      },
      {
        title: 'Community warning',
        body: warning,
      }
    );

    if (!ok) {
      throw new Error('Failed to send warning notification');
    }

    await this.resolveContentReport(report.id, adminId, 'actioned', `Warning sent: ${warning}`);
  }

  /**
   * Ban a reported user for 3 days, 7 days, or forever.
   */
  async banReportedUser(
    report: ContentReportItem,
    adminId: string,
    duration: 3 | 7 | 'forever',
    reason?: string
  ): Promise<void> {
    const isAdmin = await this.isAdmin(adminId);
    if (!isAdmin) throw new Error('User is not an admin');

    const targetUserId = report.reported_user_id || report.postPreview?.userId;
    if (!targetUserId) {
      throw new Error('No user to ban for this report');
    }

    if (targetUserId === adminId) {
      throw new Error('You cannot ban yourself');
    }

    const banReason =
      reason?.trim() ||
      'Your account was banned after a community content review.';

    let banExpiresAt: string;
    let durationLabel: string;
    if (duration === 'forever') {
      banExpiresAt = 'infinity';
      durationLabel = 'permanently';
    } else {
      const expires = new Date();
      expires.setDate(expires.getDate() + duration);
      banExpiresAt = expires.toISOString();
      durationLabel = `for ${duration} days`;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        ban_expires_at: banExpiresAt,
        ban_reason: banReason,
      })
      .eq('id', targetUserId);

    if (error) throw error;

    await notificationService.createNotification(
      {
        user_id: targetUserId,
        from_user_id: adminId,
        notification_type: 'admin_warning',
        habit_type: 'account_ban',
        message: `Your account has been banned ${durationLabel}. ${banReason}`,
      },
      {
        title: 'Account banned',
        body: `Your account has been banned ${durationLabel}.`,
      }
    );

    await this.resolveContentReport(
      report.id,
      adminId,
      'actioned',
      `User banned ${durationLabel}: ${banReason}`
    );
  }
}

export const adminService = new AdminService();

