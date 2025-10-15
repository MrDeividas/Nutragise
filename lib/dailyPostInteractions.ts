import { supabase } from './supabase';

export interface DailyPostLike {
  id: string;
  daily_post_id: string;
  user_id: string;
  created_at: string;
}

export interface DailyPostComment {
  id: string;
  daily_post_id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
  user_profile?: {
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
}

class DailyPostInteractionsService {
  // Toggle like for daily post (same logic as goals)
  async toggleDailyPostLike(dailyPostId: string): Promise<{ success: boolean; isLiked: boolean }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, isLiked: false };
      }

      // Check if already liked
      const { data: existingLike } = await supabase
        .from('goal_likes')
        .select('*')
        .eq('goal_id', dailyPostId)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike - remove the like
        const { error } = await supabase
          .from('goal_likes')
          .delete()
          .eq('goal_id', dailyPostId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error unliking daily post:', error);
          return { success: false, isLiked: true };
        }

        return { success: true, isLiked: false };
      } else {
        // Like - add the like
        const { error } = await supabase
          .from('goal_likes')
          .insert({
            goal_id: dailyPostId,
            user_id: user.id,
            created_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error liking daily post:', error);
          return { success: false, isLiked: false };
        }

        return { success: true, isLiked: true };
      }
    } catch (error) {
      console.error('Error toggling daily post like:', error);
      return { success: false, isLiked: false };
    }
  }

  // Check if daily post is liked by current user
  async isDailyPostLikedByUser(dailyPostId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('goal_likes')
        .select('*')
        .eq('goal_id', dailyPostId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking if daily post is liked:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking if daily post is liked:', error);
      return false;
    }
  }

  // Get like count for daily post
  async getDailyPostLikeCount(dailyPostId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('goal_likes')
        .select('*', { count: 'exact', head: true })
        .eq('goal_id', dailyPostId);

      if (error) {
        console.error('Error getting daily post like count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting daily post like count:', error);
      return 0;
    }
  }

  // Get interaction counts for multiple daily posts (includes comments + replies)
  async getDailyPostsInteractionCounts(dailyPostIds: string[]): Promise<{[dailyPostId: string]: { likes: number; comments: number }}> {
    try {
      // Get likes and comments data
      const [likesData, commentsData] = await Promise.all([
        supabase
          .from('goal_likes')
          .select('goal_id')
          .in('goal_id', dailyPostIds),
        supabase
          .from('goal_comments')
          .select('id, goal_id')
          .in('goal_id', dailyPostIds)
      ]);

      const likesCount: {[dailyPostId: string]: number} = {};
      const commentsCount: {[dailyPostId: string]: number} = {};

      // Count likes per daily post
      likesData.data?.forEach(like => {
        likesCount[like.goal_id] = (likesCount[like.goal_id] || 0) + 1;
      });

      // Count top-level comments per daily post
      const commentIds: string[] = [];
      commentsData.data?.forEach(comment => {
        commentsCount[comment.goal_id] = (commentsCount[comment.goal_id] || 0) + 1;
        commentIds.push(comment.id);
      });

      // Get replies count for all comments
      if (commentIds.length > 0) {
        const { data: repliesData } = await supabase
          .from('post_comment_replies')
          .select('parent_comment_id')
          .in('parent_comment_id', commentIds);

        // Add replies to comment counts (group by daily post)
        if (repliesData) {
          // Create mapping from comment ID to daily post ID
          const commentToPostMap: {[commentId: string]: string} = {};
          commentsData.data?.forEach(comment => {
            commentToPostMap[comment.id] = comment.goal_id;
          });

          // Count replies and add them to the appropriate daily post
          repliesData.forEach(reply => {
            const dailyPostId = commentToPostMap[reply.parent_comment_id];
            if (dailyPostId) {
              commentsCount[dailyPostId] = (commentsCount[dailyPostId] || 0) + 1;
            }
          });
        }
      }

      // Combine into result
      const result: {[dailyPostId: string]: { likes: number; comments: number }} = {};
      dailyPostIds.forEach(dailyPostId => {
        result[dailyPostId] = {
          likes: likesCount[dailyPostId] || 0,
          comments: commentsCount[dailyPostId] || 0
        };
      });

      return result;
    } catch (error) {
      console.error('Error getting daily posts interaction counts:', error);
      return {};
    }
  }

  // Get comments for daily post
  async getDailyPostComments(dailyPostId: string): Promise<DailyPostComment[]> {
    try {
      const { data: comments, error: commentsError } = await supabase
        .from('goal_comments')
        .select('*')
        .eq('goal_id', dailyPostId)
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('Error getting daily post comments:', commentsError);
        return [];
      }

      if (!comments || comments.length === 0) {
        return [];
      }

      // Get user profiles for comments
      const userIds = [...new Set(comments.map(c => c.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error getting user profiles:', profilesError);
      }

      // Map profiles to comments
      const profilesMap = (profiles || []).reduce((acc, profile) => {
        acc[profile.id] = profile;
        return acc;
      }, {} as {[userId: string]: any});

      return comments.map(comment => ({
        ...comment,
        daily_post_id: comment.goal_id, // Map goal_id to daily_post_id for interface consistency
        user_profile: profilesMap[comment.user_id]
      }));
    } catch (error) {
      console.error('Error getting daily post comments:', error);
      return [];
    }
  }
}

export const dailyPostInteractionsService = new DailyPostInteractionsService();
