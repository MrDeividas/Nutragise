import { supabase } from './supabase';
import { apiCache } from './apiCache';

// Calls the send-push-notification Edge Function.
// Fire-and-forget — never throws, so it never blocks the caller.
async function sendPush(
  userId: string,
  title: string,
  body: string,
  data: Record<string, any> = {}
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const supabaseUrl = (supabase as any).supabaseUrl as string;
    await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
      },
      body: JSON.stringify({ userId, title, body, data }),
    });
  } catch {
    // Push is non-critical — silently ignore any failure
  }
}

export interface Notification {
  id: string;
  user_id: string;
  from_user_id: string | null;
  notification_type: string;
  post_id: string | null;
  comment_id: string | null;
  reply_id: string | null;
  goal_id: string | null;
  is_read: boolean;
  created_at: string;
  from_user?: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  post?: {
    id: string;
    content: string;
  };
  comment?: {
    id: string;
    content: string;
  };
  reply?: {
    id: string;
    reply_text: string;
  };
  goal?: {
    id: string;
    title: string;
  };
  comment_content?: string;
  reply_content?: string;
  post_preview?: string;
  post_photo?: string | null;
  post_kind?: 'post' | 'daily_post';
  // Habit reward fields
  points_gained?: number;
  pillar_type?: string;
  pillar_progress?: number;
  habit_type?: string;
  message?: string | null;
}

type ResolvedPostTarget = {
  userId: string;
  kind: 'post' | 'daily_post';
  preview: string;
  photo: string | null;
};

class NotificationService {
  private truncate(text: string, max = 80): string {
    const cleaned = (text || '').replace(/\s+/g, ' ').trim();
    if (!cleaned) return '';
    return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
  }

  private async resolvePostTarget(postId: string): Promise<ResolvedPostTarget | null> {
    const { data: post } = await supabase
      .from('posts')
      .select('user_id, content, caption, photos')
      .eq('id', postId)
      .maybeSingle();

    if (post) {
      const preview =
        this.truncate(post.caption || post.content || '') ||
        (Array.isArray(post.photos) && post.photos.length > 0 ? 'a photo post' : 'your post');
      return {
        userId: post.user_id,
        kind: 'post',
        preview,
        photo: Array.isArray(post.photos) && post.photos[0] ? post.photos[0] : null,
      };
    }

    const { data: daily } = await supabase
      .from('daily_posts')
      .select('user_id, captions, photos, habits_completed, date')
      .eq('id', postId)
      .maybeSingle();

    if (daily) {
      const caption = Array.isArray(daily.captions)
        ? [...daily.captions].reverse().find((c: string) => !!c?.trim())
        : '';
      const habits = Array.isArray(daily.habits_completed)
        ? daily.habits_completed.filter(Boolean).slice(0, 2).join(', ')
        : '';
      const preview =
        this.truncate(caption || '') ||
        (habits ? `your ${habits} day` : '') ||
        (daily.date ? `your post from ${daily.date}` : 'your daily post');
      return {
        userId: daily.user_id,
        kind: 'daily_post',
        preview,
        photo: Array.isArray(daily.photos) && daily.photos[0] ? daily.photos[0] : null,
      };
    }

    return null;
  }

  async createNotification(
    data: {
      user_id: string;
      from_user_id?: string;
      notification_type: string;
      post_id?: string;
      comment_id?: string;
      reply_id?: string;
      goal_id?: string;
      habit_type?: string;
      message?: string;
    },
    push?: { title: string; body: string; extras?: Record<string, any> }
  ): Promise<boolean> {
    try {
      const insertData: any = { ...data };

      const { error } = await supabase
        .from('notifications')
        .insert(insertData);

      if (error) {
        console.error('Error creating notification:', error);
        return false;
      }

      apiCache.delete(apiCache.generateKey('notifications_v2', data.user_id));

      if (push) {
        sendPush(data.user_id, push.title, push.body, {
          type: data.notification_type,
          ...push.extras,
        });
      }

      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  }

  // Get notifications for a user
  async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      // Check cache first
      const cacheKey = apiCache.generateKey('notifications_v2', userId);
      const cached = apiCache.get<Notification[]>(cacheKey);
      
      if (cached !== null) {
        return cached;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Get user IDs from notifications
      const userIds = [...new Set(data.map(notification => notification.from_user_id).filter(Boolean))];

      // Fetch user profiles separately (batch query)
      let profilesMap = new Map();
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching user profiles for notifications:', profilesError);
        } else if (profiles) {
          profiles.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });
        }
      }

      // Fetch comment and reply content in parallel (batch queries)
      const commentIds = data
        .filter(n => n.comment_id)
        .map(n => n.comment_id);
      
      const replyIds = data
        .filter(n => n.reply_id)
        .map(n => n.reply_id);

      const postIds = [...new Set(data.map(n => n.post_id).filter(Boolean))];

      let commentMap = new Map();
      let replyMap = new Map();
      let postPreviewMap = new Map<string, { preview: string; photo: string | null; kind: 'post' | 'daily_post' }>();

      // Run comment, reply, and post preview queries in parallel
      const [commentsResult, goalCommentsResult, repliesResult, postsResult, dailyPostsResult] = await Promise.allSettled([
        commentIds.length > 0 
          ? supabase.from('post_comments').select('id, content').in('id', commentIds)
          : Promise.resolve({ data: null, error: null }),
        commentIds.length > 0
          ? supabase.from('goal_comments').select('id, comment_text').in('id', commentIds)
          : Promise.resolve({ data: null, error: null }),
        replyIds.length > 0
          ? supabase.from('post_comment_replies').select('id, reply_text').in('id', replyIds)
          : Promise.resolve({ data: null, error: null }),
        postIds.length > 0
          ? supabase.from('posts').select('id, content, caption, photos').in('id', postIds)
          : Promise.resolve({ data: null, error: null }),
        postIds.length > 0
          ? supabase.from('daily_posts').select('id, captions, photos, habits_completed, date').in('id', postIds)
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (commentsResult.status === 'fulfilled' && commentsResult.value.data) {
        commentsResult.value.data.forEach((comment: any) => {
          commentMap.set(comment.id, comment.content);
        });
      }

      if (goalCommentsResult.status === 'fulfilled' && goalCommentsResult.value.data) {
        goalCommentsResult.value.data.forEach((comment: any) => {
          if (!commentMap.has(comment.id)) {
            commentMap.set(comment.id, comment.comment_text);
          }
        });
      }

      if (repliesResult.status === 'fulfilled' && repliesResult.value.data) {
        repliesResult.value.data.forEach((reply: any) => {
          replyMap.set(reply.id, reply.reply_text);
        });
      }

      if (postsResult.status === 'fulfilled' && postsResult.value.data) {
        postsResult.value.data.forEach((post: any) => {
          const preview =
            this.truncate(post.caption || post.content || '') ||
            (Array.isArray(post.photos) && post.photos.length > 0 ? 'a photo post' : 'your post');
          postPreviewMap.set(post.id, {
            preview,
            photo: Array.isArray(post.photos) && post.photos[0] ? post.photos[0] : null,
            kind: 'post',
          });
        });
      }

      if (dailyPostsResult.status === 'fulfilled' && dailyPostsResult.value.data) {
        dailyPostsResult.value.data.forEach((daily: any) => {
          if (postPreviewMap.has(daily.id)) return;
          const caption = Array.isArray(daily.captions)
            ? [...daily.captions].reverse().find((c: string) => !!c?.trim())
            : '';
          const habits = Array.isArray(daily.habits_completed)
            ? daily.habits_completed.filter(Boolean).slice(0, 2).join(', ')
            : '';
          const preview =
            this.truncate(caption || '') ||
            (habits ? `your ${habits} day` : '') ||
            (daily.date ? `your post from ${daily.date}` : 'your daily post');
          postPreviewMap.set(daily.id, {
            preview,
            photo: Array.isArray(daily.photos) && daily.photos[0] ? daily.photos[0] : null,
            kind: 'daily_post',
          });
        });
      }

      // Combine notifications with profiles and content
      const result = data.map(notification => {
        const postMeta = notification.post_id ? postPreviewMap.get(notification.post_id) : undefined;
        return {
          ...notification,
          from_user: notification.from_user_id ? profilesMap.get(notification.from_user_id) : undefined,
          comment_content: notification.comment_id ? commentMap.get(notification.comment_id) : undefined,
          reply_content: notification.reply_id ? replyMap.get(notification.reply_id) : undefined,
          post_preview: postMeta?.preview,
          post_photo: postMeta?.photo ?? null,
          post_kind: postMeta?.kind,
        };
      });

      // Cache for 1 minute (notifications change frequently)
      apiCache.set(cacheKey, result, 3 * 60 * 1000); // 3 minutes instead of 1
      
      return result;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Get unread notification count (habit rewards are history, not badge alerts)
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
        .neq('notification_type', 'habit_reward');

      if (error) {
        console.error('Error fetching unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Error deleting notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Create post like notification
  async createPostLikeNotification(postId: string, fromUserId: string): Promise<boolean> {
    try {
      const target = await this.resolvePostTarget(postId);
      if (!target) return false;
      if (target.userId === fromUserId) return true;

      const { data: liker } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', fromUserId)
        .single();

      const likerName = liker?.display_name || liker?.username || 'Someone';
      const previewBit = target.preview ? `: "${target.preview}"` : '';

      const result = await this.createNotification({
        user_id: target.userId,
        from_user_id: fromUserId,
        notification_type: 'post_like',
        post_id: postId,
      });

      sendPush(target.userId, '❤️ New Like', `${likerName} liked your post${previewBit}`, {
        type: 'post_like',
        postId,
      });

      return result;
    } catch (error) {
      console.error('Error creating post like notification:', error);
      return false;
    }
  }

  // Create post comment notification
  async createPostCommentNotification(postId: string, commentId: string, fromUserId: string): Promise<boolean> {
    try {
      const target = await this.resolvePostTarget(postId);
      if (!target) return false;
      if (target.userId === fromUserId) return true;

      const { data: commenter } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', fromUserId)
        .single();

      const commenterName = commenter?.display_name || commenter?.username || 'Someone';
      const previewBit = target.preview ? ` on "${target.preview}"` : '';

      const result = await this.createNotification({
        user_id: target.userId,
        from_user_id: fromUserId,
        notification_type: 'post_comment',
        post_id: postId,
        comment_id: commentId,
      });

      sendPush(target.userId, '💬 New Comment', `${commenterName} commented${previewBit}`, {
        type: 'post_comment',
        postId,
      });

      return result;
    } catch (error) {
      console.error('Error creating post comment notification:', error);
      return false;
    }
  }

  // Create post reply notification
  async createPostReplyNotification(commentId: string, replyId: string, fromUserId: string): Promise<boolean> {
    try {
      // Get comment owner (regular post comments first, then daily/goal comments)
      let commentOwnerId: string | null = null;
      let postId: string | null = null;

      const { data: postComment, error: commentError } = await supabase
        .from('post_comments')
        .select('user_id, post_id')
        .eq('id', commentId)
        .maybeSingle();

      if (commentError && commentError.code !== 'PGRST116') {
        console.error('Error fetching comment:', commentError);
      }

      if (postComment) {
        commentOwnerId = postComment.user_id;
        postId = postComment.post_id;
      } else {
        const { data: goalComment } = await supabase
          .from('goal_comments')
          .select('user_id, goal_id')
          .eq('id', commentId)
          .maybeSingle();
        if (goalComment) {
          commentOwnerId = goalComment.user_id;
          postId = goalComment.goal_id;
        }
      }

      if (!commentOwnerId) return false;
      if (commentOwnerId === fromUserId) return true;

      const { data: replier } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', fromUserId)
        .single();

      const replierName = replier?.display_name || replier?.username || 'Someone';

      const result = await this.createNotification({
        user_id: commentOwnerId,
        from_user_id: fromUserId,
        notification_type: 'post_reply',
        post_id: postId || undefined,
        comment_id: commentId,
        reply_id: replyId,
      });

      sendPush(commentOwnerId, '↩️ New Reply', `${replierName} replied to your comment`, {
        type: 'post_reply',
        postId: postId || undefined,
        commentId,
      });

      return result;
    } catch (error) {
      console.error('Error creating post reply notification:', error);
      return false;
    }
  }

  /**
   * Recent habit EXP rewards (gains). Undos delete these rows — losses are not stored.
   */
  async getHabitRewardHistory(
    userId: string,
    limit: number = 40,
    days: number = 14
  ): Promise<Notification[]> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      since.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('notification_type', 'habit_reward')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching habit reward history:', error);
        return [];
      }

      return (data || []) as Notification[];
    } catch (error) {
      console.error('Error in getHabitRewardHistory:', error);
      return [];
    }
  }

  // Create a habit reward notification
  async createHabitRewardNotification(data: {
    user_id: string;
    habit_type: string;
    points_gained: number;
    pillar_type?: string;
    pillar_progress?: number;
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: data.user_id,
          from_user_id: null,
          notification_type: 'habit_reward',
          post_id: null,
          comment_id: null,
          reply_id: null,
          goal_id: null,
          points_gained: data.points_gained,
          pillar_type: data.pillar_type,
          pillar_progress: data.pillar_progress,
          habit_type: data.habit_type,
          is_read: true, // history feed only — never badge
        });

      if (error) {
        console.error('Error creating habit reward notification:', error);
        return false;
      }

      // Invalidate notifications cache
      apiCache.delete(apiCache.generateKey('notifications_v2', data.user_id));

      return true;
    } catch (error) {
      console.error('Error creating habit reward notification:', error);
      return false;
    }
  }

  // Delete habit reward notifications for a specific habit
  async deleteHabitRewardNotification(userId: string, habitType: string, date: string): Promise<boolean> {
    try {
      // Delete notifications for this habit on this date
      // We use created_at to match the day (within 24 hours of the habit date)
      const habitDate = new Date(date);
      const startOfDay = new Date(habitDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(habitDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('notification_type', 'habit_reward')
        .eq('habit_type', habitType)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      if (error) {
        console.error('Error deleting habit reward notification:', error);
        return false;
      }

      // Invalidate notifications cache
      apiCache.delete(apiCache.generateKey('notifications_v2', userId));

      return true;
    } catch (error) {
      console.error('Error deleting habit reward notification:', error);
      return false;
    }
  }

  // Create habit nudge notification
  async createHabitNudgeNotification(
    nudgedUserId: string,
    nudgerId: string,
    habitTitle: string
  ): Promise<boolean> {
    try {
      if (nudgedUserId === nudgerId) return true;

      // Fetch nudger's display name for the notification text
      const { data: nudgerProfile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', nudgerId)
        .single();

      const nudgerName = nudgerProfile?.display_name || nudgerProfile?.username || 'Your partner';

      const result = await this.createNotification({
        user_id: nudgedUserId,
        from_user_id: nudgerId,
        notification_type: 'habit_nudge',
        habit_type: habitTitle?.trim() || 'habit',
      });

      // Fire push notification — non-blocking
      sendPush(
        nudgedUserId,
        '👋 Habit Nudge',
        `${nudgerName} nudged you to complete "${habitTitle?.trim() || 'a habit'}"`,
        { type: 'habit_nudge', nudgerId, habitType: habitTitle }
      );

      return result;
    } catch (error) {
      console.error('Error creating habit nudge notification:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
