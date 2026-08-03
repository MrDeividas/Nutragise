import { supabase } from './supabase';

export type ContentReportReason =
  | 'inappropriate_photo'
  | 'inappropriate_content'
  | 'block_account';

export type PostSource = 'posts' | 'daily_posts';

class ModerationService {
  async reportContent(params: {
    reporterId: string;
    reportedUserId?: string | null;
    postId?: string | null;
    postSource?: PostSource | null;
    reason: ContentReportReason;
  }): Promise<void> {
    const { error } = await supabase.from('content_reports').insert({
      reporter_id: params.reporterId,
      reported_user_id: params.reportedUserId || null,
      post_id: params.postId || null,
      post_source: params.postSource || null,
      reason: params.reason,
      review_status: 'pending',
    });

    if (error) {
      if (error.code === '23505') {
        throw new Error('You have already reported this post.');
      }
      throw error;
    }
  }

  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) {
      throw new Error('You cannot block yourself');
    }

    const { error } = await supabase.from('user_blocks').upsert(
      {
        blocker_id: blockerId,
        blocked_id: blockedId,
      },
      { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true }
    );

    if (error) throw error;

    // Also store a report trail for moderation review
    await this.reportContent({
      reporterId: blockerId,
      reportedUserId: blockedId,
      reason: 'block_account',
    });
  }

  async getBlockedUserIds(blockerId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('user_blocks')
      .select('blocked_id')
      .eq('blocker_id', blockerId);

    if (error) {
      console.error('Error loading blocked users:', error);
      return [];
    }

    return (data || []).map((row) => row.blocked_id).filter(Boolean);
  }
}

export const moderationService = new ModerationService();
