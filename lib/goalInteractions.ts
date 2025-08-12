import { supabase } from './supabase';

export interface GoalLike {
  id: string;
  goal_id: string;
  user_id: string;
  created_at: string;
}

export interface GoalComment {
  id: string;
  goal_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  user_profile?: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface CommentReply {
  id: string;
  parent_comment_id: string;
  user_id: string;
  reply_text: string;
  created_at: string;
  user_profile?: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

class GoalInteractionsService {
  // Like a goal
  async likeGoal(goalId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('like_goal', {
        goal_id_param: goalId
      });

      if (error) {
        console.error('Error liking goal:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error liking goal:', error);
      return false;
    }
  }

  // Unlike a goal
  async unlikeGoal(goalId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('unlike_goal', {
        goal_id_param: goalId
      });

      if (error) {
        console.error('Error unliking goal:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error unliking goal:', error);
      return false;
    }
  }

  // Check if current user has liked a goal
  async isGoalLikedByUser(goalId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_goal_liked_by_user', {
        goal_id_param: goalId
      });

      if (error) {
        console.error('Error checking if goal is liked:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error checking if goal is liked:', error);
      return false;
    }
  }

  // Get like count for a goal
  async getGoalLikeCount(goalId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_goal_like_count', {
        goal_id_param: goalId
      });

      if (error) {
        console.error('Error getting goal like count:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error getting goal like count:', error);
      return 0;
    }
  }

  // Add a comment to a goal
  async addGoalComment(goalId: string, commentText: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('add_goal_comment', {
        goal_id_param: goalId,
        comment_text_param: commentText
      });

      if (error) {
        console.error('Error adding goal comment:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error adding goal comment:', error);
      return null;
    }
  }

  // Get comments for a goal
  async getGoalComments(goalId: string): Promise<GoalComment[]> {
    try {
      // First get the comments
      const { data: comments, error: commentsError } = await supabase
        .from('goal_comments')
        .select('*')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error getting goal comments:', commentsError);
        return [];
      }

      if (!comments || comments.length === 0) {
        return [];
      }

      // Get user IDs from comments
      const userIds = [...new Set(comments.map(comment => comment.user_id))];

      // Fetch user profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error getting user profiles for comments:', profilesError);
        // Return comments without profiles
        return comments.map(comment => ({
          ...comment,
          user_profile: undefined
        }));
      }

      // Create a map of user ID to profile
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // Combine comments with profiles
      return comments.map(comment => ({
        ...comment,
        user_profile: profileMap.get(comment.user_id)
      }));
    } catch (error) {
      console.error('Error getting goal comments:', error);
      return [];
    }
  }

  // Get comment count for a goal
  async getGoalCommentCount(goalId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('goal_comments')
        .select('*', { count: 'exact', head: true })
        .eq('goal_id', goalId);

      if (error) {
        console.error('Error getting goal comment count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting goal comment count:', error);
      return 0;
    }
  }

  // Get likes for a goal with user profiles
  async getGoalLikes(goalId: string): Promise<GoalLike[]> {
    try {
      // First get the likes
      const { data: likes, error: likesError } = await supabase
        .from('goal_likes')
        .select('*')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: false });

      if (likesError) {
        console.error('Error getting goal likes:', likesError);
        return [];
      }

      if (!likes || likes.length === 0) {
        return [];
      }

      // Get user IDs from likes
      const userIds = [...new Set(likes.map(like => like.user_id))];

      // Fetch user profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error getting user profiles for likes:', profilesError);
        // Return likes without profiles
        return likes.map(like => ({
          ...like,
          user_profile: undefined
        }));
      }

      // Create a map of user ID to profile
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // Combine likes with profiles
      return likes.map(like => ({
        ...like,
        user_profile: profileMap.get(like.user_id)
      }));
    } catch (error) {
      console.error('Error getting goal likes:', error);
      return [];
    }
  }

  // Toggle like status (like if not liked, unlike if liked)
  async toggleGoalLike(goalId: string): Promise<{ success: boolean; isLiked: boolean }> {
    try {
      const isCurrentlyLiked = await this.isGoalLikedByUser(goalId);
      
      if (isCurrentlyLiked) {
        const success = await this.unlikeGoal(goalId);
        return { success, isLiked: false };
      } else {
        const success = await this.likeGoal(goalId);
        return { success, isLiked: true };
      }
    } catch (error) {
      console.error('Error toggling goal like:', error);
      return { success: false, isLiked: false };
    }
  }

  // Get interaction counts for multiple goals
  async getGoalsInteractionCounts(goalIds: string[]): Promise<{[goalId: string]: { likes: number; comments: number }}> {
    try {
      const [likesData, commentsData] = await Promise.all([
        supabase
          .from('goal_likes')
          .select('goal_id')
          .in('goal_id', goalIds),
        supabase
          .from('goal_comments')
          .select('goal_id')
          .in('goal_id', goalIds)
      ]);

      const likesCount: {[goalId: string]: number} = {};
      const commentsCount: {[goalId: string]: number} = {};

      // Count likes per goal
      likesData.data?.forEach(like => {
        likesCount[like.goal_id] = (likesCount[like.goal_id] || 0) + 1;
      });

      // Count comments per goal
      commentsData.data?.forEach(comment => {
        commentsCount[comment.goal_id] = (commentsCount[comment.goal_id] || 0) + 1;
      });

      // Combine into result
      const result: {[goalId: string]: { likes: number; comments: number }} = {};
      goalIds.forEach(goalId => {
        result[goalId] = {
          likes: likesCount[goalId] || 0,
          comments: commentsCount[goalId] || 0
        };
      });

      return result;
    } catch (error) {
      console.error('Error getting goals interaction counts:', error);
      return {};
    }
  }

  // Comment Like Methods
  async likeComment(commentId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('like_comment', {
        comment_id_param: commentId
      });

      if (error) {
        console.error('Error liking comment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error liking comment:', error);
      return false;
    }
  }

  async unlikeComment(commentId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('unlike_comment', {
        comment_id_param: commentId
      });

      if (error) {
        console.error('Error unliking comment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error unliking comment:', error);
      return false;
    }
  }

  async isCommentLikedByUser(commentId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_comment_liked_by_user', {
        comment_id_param: commentId
      });

      if (error) {
        console.error('Error checking if comment is liked:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error checking if comment is liked:', error);
      return false;
    }
  }

  async getCommentLikeCount(commentId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_comment_like_count', {
        comment_id_param: commentId
      });

      if (error) {
        console.error('Error getting comment like count:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error getting comment like count:', error);
      return 0;
    }
  }

  async toggleCommentLike(commentId: string): Promise<{ success: boolean; isLiked: boolean }> {
    try {
      const isCurrentlyLiked = await this.isCommentLikedByUser(commentId);
      
      if (isCurrentlyLiked) {
        const success = await this.unlikeComment(commentId);
        return { success, isLiked: false };
      } else {
        const success = await this.likeComment(commentId);
        return { success, isLiked: true };
      }
    } catch (error) {
      console.error('Error toggling comment like:', error);
      return { success: false, isLiked: false };
    }
  }

  // Comment Reply Methods
  async addCommentReply(parentCommentId: string, replyText: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('add_comment_reply', {
        parent_comment_id_param: parentCommentId,
        reply_text_param: replyText
      });

      if (error) {
        console.error('Error adding comment reply:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error adding comment reply:', error);
      return null;
    }
  }

  async getCommentReplies(parentCommentId: string): Promise<CommentReply[]> {
    try {
      const { data: replies, error: repliesError } = await supabase
        .from('comment_replies')
        .select('*')
        .eq('parent_comment_id', parentCommentId)
        .order('created_at', { ascending: true });

      if (repliesError) {
        console.error('Error getting comment replies:', repliesError);
        return [];
      }

      if (!replies || replies.length === 0) {
        return [];
      }

      // Get user IDs from replies
      const userIds = [...new Set(replies.map(reply => reply.user_id))];

      // Fetch user profiles separately
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error getting user profiles for replies:', profilesError);
        // Return replies without profiles
        return replies.map(reply => ({
          ...reply,
          user_profile: undefined
        }));
      }

      // Create a map of user ID to profile
      const profileMap = new Map();
      profiles?.forEach(profile => {
        profileMap.set(profile.id, profile);
      });

      // Combine replies with profiles
      return replies.map(reply => ({
        ...reply,
        user_profile: profileMap.get(reply.user_id)
      }));
    } catch (error) {
      console.error('Error getting comment replies:', error);
      return [];
    }
  }

  async getCommentReplyCount(parentCommentId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_comment_reply_count', {
        parent_comment_id_param: parentCommentId
      });

      if (error) {
        console.error('Error getting comment reply count:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error getting comment reply count:', error);
      return 0;
    }
  }
}

export const goalInteractionsService = new GoalInteractionsService(); 