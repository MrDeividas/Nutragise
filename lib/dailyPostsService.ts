import { supabase } from './supabase';
import { getDailyPostDate } from './timeService';

export interface DailyPost {
  id: string;
  user_id: string;
  date: string;
  photos: string[];
  captions: string[];
  habits_completed: string[];
  total_photos: number;
  total_habits: number;
  post_count: number;
  created_at: string;
  updated_at: string;
}

export interface DailyPostWithProfile extends DailyPost {
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

export interface CreateDailyPostData {
  photos: string[];
  captions: string[];
  habits_completed: string[];
}

class DailyPostsService {
  /**
   * Get daily post by user and date
   */
  async getDailyPostByDate(userId: string, date: string): Promise<DailyPost | null> {
    try {
      const { data, error } = await supabase
        .from('daily_posts')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No data found
          return null;
        }
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error getting daily post by date:', error);
      return null;
    }
  }

  /**
   * Create a new daily post
   */
  async createDailyPost(userId: string, date: string, postData: CreateDailyPostData): Promise<DailyPost | null> {
    try {
      const { data, error } = await supabase
        .from('daily_posts')
        .insert({
          user_id: userId,
          date: date,
          photos: postData.photos,
          captions: postData.captions,
          habits_completed: postData.habits_completed,
          total_photos: postData.photos.length,
          total_habits: postData.habits_completed.length,
          post_count: 1
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creating daily post:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in createDailyPost:', error);
      return null;
    }
  }

  /**
   * Add content to existing daily post
   */
  async addToDailyPost(dailyPostId: string, postData: CreateDailyPostData): Promise<DailyPost | null> {
    try {
      // Get existing daily post
      const { data: existing, error: fetchError } = await supabase
        .from('daily_posts')
        .select('*')
        .eq('id', dailyPostId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching existing daily post:', fetchError);
        return null;
      }
      
      // Merge data - put new photos first (most recent first)
      const updatedPhotos = [...postData.photos, ...existing.photos];
      const updatedCaptions = [...postData.captions, ...existing.captions];
      
      // Merge habits (unique values only)
      const updatedHabits = [...new Set([...existing.habits_completed, ...postData.habits_completed])];
      
      // Update daily post
      const { data, error } = await supabase
        .from('daily_posts')
        .update({
          photos: updatedPhotos,
          captions: updatedCaptions,
          habits_completed: updatedHabits,
          total_photos: updatedPhotos.length,
          total_habits: updatedHabits.length,
          post_count: existing.post_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', dailyPostId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating daily post:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in addToDailyPost:', error);
      return null;
    }
  }

  /**
   * Fix caption order to match photo order (run once to fix existing data)
   */
  async fixCaptionOrder(userId: string): Promise<void> {
    try {
      // Get all daily posts for this user
      const { data: dailyPosts, error } = await supabase
        .from('daily_posts')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching daily posts for caption fix:', error);
        return;
      }

      if (!dailyPosts || dailyPosts.length === 0) return;

      // Fix each daily post that has mismatched captions
      for (const dailyPost of dailyPosts) {
        if (dailyPost.photos && dailyPost.photos.length > 1 && dailyPost.captions && dailyPost.captions.length > 1) {
          // Reverse the captions to match the already-reversed photos
          const reversedCaptions = [...dailyPost.captions].reverse();

          // Update only the captions
          await supabase
            .from('daily_posts')
            .update({
              captions: reversedCaptions,
              updated_at: new Date().toISOString()
            })
            .eq('id', dailyPost.id);
        }
      }
    } catch (error) {
      console.error('Error fixing caption order:', error);
    }
  }

  /**
   * Delete a daily post
   */
  async deleteDailyPost(dailyPostId: string): Promise<boolean> {
    try {
      // SECURITY: Verify user owns this daily post before deleting
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return false;
      }

      const { error } = await supabase
        .from('daily_posts')
        .delete()
        .eq('id', dailyPostId)
        .eq('user_id', user.id); // SECURITY: Only delete if user owns this post

      if (error) {
        console.error('Error deleting daily post:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteDailyPost:', error);
      return false;
    }
  }

  /**
   * Get recent daily posts for journey preview
   */
  async getRecentJourney(userId: string, limit: number = 3): Promise<DailyPost[]> {
    try {
      const { data, error } = await supabase
        .from('daily_posts')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error getting recent journey:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getRecentJourney:', error);
      return [];
    }
  }

  /**
   * Get all daily posts for user (full journey)
   */
  async getAllJourney(userId: string): Promise<DailyPost[]> {
    try {
      const { data, error } = await supabase
        .from('daily_posts')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Error getting all journey:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getAllJourney:', error);
      return [];
    }
  }

  /**
   * Get daily posts for explore feed with profile data
   */
  async getExploreDailyPosts(limit: number = 50): Promise<DailyPostWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from('daily_posts_with_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error getting explore daily posts:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getExploreDailyPosts:', error);
      return [];
    }
  }

  /**
   * Get daily posts from followed users
   */
  async getFollowingDailyPosts(userId: string, limit: number = 50): Promise<DailyPostWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from('daily_posts_with_profiles')
        .select(`
          *,
          follows!inner(follower_id)
        `)
        .eq('follows.follower_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Error getting following daily posts:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getFollowingDailyPosts:', error);
      return [];
    }
  }

  /**
   * Get daily post by ID with profile data
   */
  async getDailyPostById(dailyPostId: string): Promise<DailyPostWithProfile | null> {
    try {
      const { data, error } = await supabase
        .from('daily_posts_with_profiles')
        .select('*')
        .eq('id', dailyPostId)
        .single();
      
      if (error) {
        console.error('Error getting daily post by ID:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getDailyPostById:', error);
      return null;
    }
  }

  /**
   * Delete daily post
   */
  async deleteDailyPost(dailyPostId: string): Promise<boolean> {
    try {
      // SECURITY: Verify user owns this daily post before deleting
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('User not authenticated');
        return false;
      }

      const { error } = await supabase
        .from('daily_posts')
        .delete()
        .eq('id', dailyPostId)
        .eq('user_id', user.id); // SECURITY: Only delete if user owns this post
      
      if (error) {
        console.error('Error deleting daily post:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteDailyPost:', error);
      return false;
    }
  }

  /**
   * Get today's daily post for current user
   */
  async getTodaysDailyPost(userId: string): Promise<DailyPost | null> {
    const today = getDailyPostDate(new Date());
    return await this.getDailyPostByDate(userId, today);
  }

  /**
   * Check if user has posted today
   */
  async hasPostedToday(userId: string): Promise<boolean> {
    const todaysPost = await this.getTodaysDailyPost(userId);
    return todaysPost !== null;
  }

  /**
   * Get daily post statistics for user
   */
  async getDailyPostStats(userId: string): Promise<{
    totalDays: number;
    totalPhotos: number;
    totalHabits: number;
    averagePhotosPerDay: number;
    averageHabitsPerDay: number;
    mostActiveDay: string | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('daily_posts')
        .select('*')
        .eq('user_id', userId);
      
      if (error || !data) {
        return {
          totalDays: 0,
          totalPhotos: 0,
          totalHabits: 0,
          averagePhotosPerDay: 0,
          averageHabitsPerDay: 0,
          mostActiveDay: null
        };
      }
      
      const totalDays = data.length;
      const totalPhotos = data.reduce((sum, post) => sum + post.total_photos, 0);
      const totalHabits = data.reduce((sum, post) => sum + post.total_habits, 0);
      
      const mostActivePost = data.reduce((max, post) => 
        post.total_photos > max.total_photos ? post : max, 
        data[0] || { total_photos: 0, date: null }
      );
      
      return {
        totalDays,
        totalPhotos,
        totalHabits,
        averagePhotosPerDay: totalDays > 0 ? Math.round(totalPhotos / totalDays * 10) / 10 : 0,
        averageHabitsPerDay: totalDays > 0 ? Math.round(totalHabits / totalDays * 10) / 10 : 0,
        mostActiveDay: mostActivePost.date
      };
    } catch (error) {
      console.error('Error getting daily post stats:', error);
      return {
        totalDays: 0,
        totalPhotos: 0,
        totalHabits: 0,
        averagePhotosPerDay: 0,
        averageHabitsPerDay: 0,
        mostActiveDay: null
      };
    }
  }
}

export const dailyPostsService = new DailyPostsService();
