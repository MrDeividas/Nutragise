import { supabase } from './supabase';

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
  }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert(data);

      if (error) {
        console.error('Error creating notification:', error);
        return false;
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

      // Fetch user profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching user profiles for notifications:', profilesError);
        // Return notifications without profiles
        return data.map(notification => ({
          ...notification,
          from_user: undefined
        }));
      }

      // Create a map of user ID to profile
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // Fetch comment content for comment and reply notifications
      const commentIds = data
        .filter(n => n.comment_id)
        .map(n => n.comment_id);
      
      const replyIds = data
        .filter(n => n.reply_id)
        .map(n => n.reply_id);

      let commentMap = new Map();
      let replyMap = new Map();

      if (commentIds.length > 0) {
        const { data: comments, error: commentsError } = await supabase
          .from('post_comments')
          .select('id, content')
          .in('id', commentIds);

        if (!commentsError && comments) {
          comments.forEach(comment => {
            commentMap.set(comment.id, comment.content);
          });
        }
      }

      if (replyIds.length > 0) {
        const { data: replies, error: repliesError } = await supabase
          .from('post_comment_replies')
          .select('id, reply_text')
          .in('id', replyIds);

        if (!repliesError && replies) {
          replies.forEach(reply => {
            replyMap.set(reply.id, reply.reply_text);
          });
        }
      }

      // Combine notifications with profiles and content
      return data.map(notification => ({
        ...notification,
        from_user: notification.from_user_id ? profileMap.get(notification.from_user_id) : undefined,
        comment_content: notification.comment_id ? commentMap.get(notification.comment_id) : undefined,
        reply_content: notification.reply_id ? replyMap.get(notification.reply_id) : undefined
      }));
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

      if (commentError || !comment) {
        console.error('Error fetching comment:', commentError);
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
}

export const notificationService = new NotificationService();
