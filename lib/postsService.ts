import { supabase } from './supabase';
import { Post, CreatePostData, UpdatePostData, DailyPostGroup } from '../types/database';

class PostsService {
  /**
   * Create a new post
   */
  async createPost(postData: CreatePostData): Promise<Post | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check daily post limit
      const canPost = await this.checkDailyPostLimit(user.id, postData.date);
      if (!canPost) {
        throw new Error('Daily post limit reached (30 posts per day)');
      }

      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: postData.content,
          goal_id: postData.goal_id,
          date: postData.date,
          photos: postData.photos,
          habits_completed: postData.habits_completed,
          caption: postData.caption,
          mood_rating: postData.mood_rating,
          energy_level: postData.energy_level,
          is_public: postData.is_public ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in createPost:', error);
      return null;
    }
  }

  /**
   * Get posts for a user, grouped by date
   */
  async getUserPosts(userId: string, limit: number = 50): Promise<DailyPostGroup[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user posts:', error);
        return [];
      }

      // Group posts by date
      const groupedPosts = this.groupPostsByDate(data || []);
      return groupedPosts;
    } catch (error) {
      console.error('Error in getUserPosts:', error);
      return [];
    }
  }

  /**
   * Get posts for a specific date
   */
  async getPostsByDate(userId: string, date: string): Promise<Post[]> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts by date:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPostsByDate:', error);
      return [];
    }
  }

  /**
   * Update a post
   */
  async updatePost(postId: string, updateData: UpdatePostData): Promise<Post | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', postId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating post:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in updatePost:', error);
      return null;
    }
  }

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting post:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deletePost:', error);
      return false;
    }
  }

  /**
   * Check if user has reached daily post limit
   */
  async checkDailyPostLimit(userId: string, date: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', userId)
        .eq('date', date);

      if (error) {
        console.error('Error checking daily post limit:', error);
        return false;
      }

      return (data?.length || 0) < 30;
    } catch (error) {
      console.error('Error in checkDailyPostLimit:', error);
      return false;
    }
  }

  /**
   * Record profile view for "new" indicators
   */
  async recordProfileView(profileUserId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profile_views')
        .upsert({
          viewer_id: user.id,
          profile_user_id: profileUserId,
          last_viewed_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error recording profile view:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in recordProfileView:', error);
      return false;
    }
  }

  /**
   * Get posts created after user's last profile view
   */
  async getNewPosts(userId: string, profileUserId: string): Promise<Post[]> {
    try {
      // Get last viewed time
      const { data: lastView, error: viewError } = await supabase
        .from('profile_views')
        .select('last_viewed_at')
        .eq('viewer_id', userId)
        .eq('profile_user_id', profileUserId)
        .single();

      if (viewError && viewError.code !== 'PGRST116') {
        console.error('Error fetching last view:', viewError);
        return [];
      }

      const lastViewedAt = lastView?.last_viewed_at || new Date(0).toISOString();

      // Get posts created after last view
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profileUserId)
        .eq('is_public', true)
        .gt('created_at', lastViewedAt)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching new posts:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getNewPosts:', error);
      return [];
    }
  }

  /**
   * Group posts by date for daily containers
   */
  private groupPostsByDate(posts: Post[]): DailyPostGroup[] {
    const grouped: { [date: string]: Post[] } = {};
    
    posts.forEach(post => {
      if (!grouped[post.date]) {
        grouped[post.date] = [];
      }
      grouped[post.date].push(post);
    });

    return Object.entries(grouped)
      .map(([date, posts]) => ({
        date,
        posts: posts.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
        isNewDay: false, // Will be set by caller based on last view
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Get habit verification status (with photo evidence)
   */
  async getHabitVerificationStatus(userId: string, date: string, habitType: string): Promise<'verified' | 'completed' | 'incomplete'> {
    try {
      const { data, error } = await supabase.rpc('get_habit_verification_status', {
        user_uuid: userId,
        habit_date: date,
        habit_type: habitType
      });

      if (error) {
        console.error('Error getting habit verification status:', error);
        return 'incomplete';
      }

      return data as 'verified' | 'completed' | 'incomplete';
    } catch (error) {
      console.error('Error in getHabitVerificationStatus:', error);
      return 'incomplete';
    }
  }
}

export const postsService = new PostsService();
