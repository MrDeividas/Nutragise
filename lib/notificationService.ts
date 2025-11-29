import { supabase } from './supabase';
import { apiCache } from './apiCache';

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
  // Habit reward fields
  points_gained?: number;
  pillar_type?: string;
  pillar_progress?: number;
  habit_type?: string;
}

class NotificationService {
  // Create a notification
  async createNotification(data: {
    user_id: string;
    from_user_id?: string;
    notification_type: string;
    post_id?: string;
    comment_id?: string;
    reply_id?: string;
    goal_id?: string;
    habit_type?: string; // e.g. 'custom' or core habit key
  }): Promise<boolean> {
    try {
      // Filter out undefined fields before inserting
      const insertData: any = { ...data };
      
      // Remove habit_type from insert if it's not a standard column or add it to metadata/json field if table doesn't support it
      // For now, assuming we might store it in metadata or a generic field if table allows.
      // Based on schema, we might not have habit_type column. Let's check if we should use 'goal_id' or another field as proxy,
      // or just rely on notification_type to imply context. 
      
      // However, we need to pass the habit info. 
      // If the notifications table is strict, we might need to add a column or use existing nullable columns.
      // Given I can't modify the notifications table schema right now without a migration (which I did for new tables but not existing ones),
      // I will check if I can use `metadata` or `payload` JSONB column if it exists, or just omit if not critical for the list view.
      // BUT, the `createNotification` signature in the interface `Notification` has `habit_type` optional field.
      // Let's assume for now we can pass it if the DB accepts it, or we just rely on `notification_type` string.
      
      // Actually, to be safe and follow existing pattern, I will stick to existing columns.
      // If habit_type is needed, we might need to add it to the DB or use a JSON column.
      // For this plan, I will add it to `create_habit_accountability_tables.sql` if I could, but I already wrote that.
      // I'll check if `notification_type` is enough or if I can piggyback on `goal_id` (bad practice) or just not store it explicitly 
      // and rely on fetching the invite details when user clicks.
      
      // Better approach: Store the invite info in the notification `notification_type` or just fetch latest invite in the UI.
      // Or, if `goal_id` is nullable UUID, I can't put 'run' there.
      
      // I'll just strip extra fields that don't map to DB columns to avoid errors.
      delete insertData.habit_type;

      const { error } = await supabase
        .from('notifications')
        .insert(insertData);

      if (error) {
        console.error('Error creating notification:', error);
        return false;
      }

      // Invalidate notifications cache
      apiCache.delete(apiCache.generateKey('notifications', data.user_id));

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
      const cacheKey = apiCache.generateKey('notifications', userId);
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

      let commentMap = new Map();
      let replyMap = new Map();

      // Run comment and reply queries in parallel
      const [commentsResult, repliesResult] = await Promise.allSettled([
        commentIds.length > 0 
          ? supabase.from('post_comments').select('id, content').in('id', commentIds)
          : Promise.resolve({ data: null, error: null }),
        replyIds.length > 0
          ? supabase.from('post_comment_replies').select('id, reply_text').in('id', replyIds)
          : Promise.resolve({ data: null, error: null })
      ]);

      if (commentsResult.status === 'fulfilled' && commentsResult.value.data) {
        commentsResult.value.data.forEach(comment => {
          commentMap.set(comment.id, comment.content);
        });
      }

      if (repliesResult.status === 'fulfilled' && repliesResult.value.data) {
        repliesResult.value.data.forEach(reply => {
          replyMap.set(reply.id, reply.reply_text);
        });
      }

      // Combine notifications with profiles and content
      const result = data.map(notification => ({
        ...notification,
        from_user: notification.from_user_id ? profilesMap.get(notification.from_user_id) : undefined,
        comment_content: notification.comment_id ? commentMap.get(notification.comment_id) : undefined,
        reply_content: notification.reply_id ? replyMap.get(notification.reply_id) : undefined
      }));

      // Cache for 1 minute (notifications change frequently)
      apiCache.set(cacheKey, result, 3 * 60 * 1000); // 3 minutes instead of 1
      
      return result;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

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
      // Get post owner
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (postError || !post) {
        console.error('Error fetching post:', postError);
        return false;
      }

      // Don't notify yourself
      if (post.user_id === fromUserId) {
        return true;
      }

      return await this.createNotification({
        user_id: post.user_id,
        from_user_id: fromUserId,
        notification_type: 'post_like',
        post_id: postId,
      });
    } catch (error) {
      console.error('Error creating post like notification:', error);
      return false;
    }
  }

  // Create post comment notification
  async createPostCommentNotification(postId: string, commentId: string, fromUserId: string): Promise<boolean> {
    try {
      // Get post owner
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('user_id')
        .eq('id', postId)
        .single();

      if (postError || !post) {
        console.error('Error fetching post:', postError);
        return false;
      }

      // Don't notify yourself
      if (post.user_id === fromUserId) {
        return true;
      }

      return await this.createNotification({
        user_id: post.user_id,
        from_user_id: fromUserId,
        notification_type: 'post_comment',
        post_id: postId,
        comment_id: commentId,
      });
    } catch (error) {
      console.error('Error creating post comment notification:', error);
      return false;
    }
  }

  // Create post reply notification
  async createPostReplyNotification(commentId: string, replyId: string, fromUserId: string): Promise<boolean> {
    try {
      // Get comment owner
      const { data: comment, error: commentError } = await supabase
        .from('post_comments')
        .select('user_id')
        .eq('id', commentId)
        .single();

      if (commentError) {
        // Suppress PGRST116 error (no rows found) - this is normal when comment doesn't exist in post_comments table
        if (commentError.code !== 'PGRST116') {
          console.error('Error fetching comment:', commentError);
        }
        return false;
      }

      if (!comment) {
        return false;
      }

      // Don't notify yourself
      if (comment.user_id === fromUserId) {
        return true;
      }

      return await this.createNotification({
        user_id: comment.user_id,
        from_user_id: fromUserId,
        notification_type: 'post_reply',
        comment_id: commentId,
        reply_id: replyId,
      });
    } catch (error) {
      console.error('Error creating post reply notification:', error);
      return false;
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
        });

      if (error) {
        console.error('Error creating habit reward notification:', error);
        return false;
      }

      // Invalidate notifications cache
      apiCache.delete(apiCache.generateKey('notifications', data.user_id));

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
      apiCache.delete(apiCache.generateKey('notifications', userId));

      return true;
    } catch (error) {
      console.error('Error deleting habit reward notification:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
