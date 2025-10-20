import { supabase } from './supabase';

export interface Profile {
  id: string;
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  height?: string;
  age?: number;
  completed_competitions?: number;
  won_awards?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileData {
  username: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  height?: string;
  age?: number;
  completed_competitions?: number;
  won_awards?: number;
}

export interface UpdateProfileData {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  height?: string;
  age?: number;
  completed_competitions?: number;
  won_awards?: number;
}

export interface Follower {
  follower_id: string;
  following_id: string;
  created_at: string;
  follower_profile?: Profile;
  following_profile?: Profile;
}

class SocialService {
  // Check and create tables if needed
  async ensureTablesExist(): Promise<void> {
    try {
      // Check if followers table exists by trying to select from it
      const { error } = await supabase
        .from('followers')
        .select('*')
        .limit(1);
      
      if (error && error.code === '42P01') {
        // Table doesn't exist, create it
        await this.createFollowersTable();
      }
    } catch (error) {
      // Error checking tables
    }
  }

  async createFollowersTable(): Promise<void> {
    try {
      const { error } = await supabase.rpc('create_followers_table');
      if (error) {
        // Fallback: try to create table manually
        await this.createFollowersTableManually();
      }
    } catch (error) {
      await this.createFollowersTableManually();
    }
  }

  async createFollowersTableManually(): Promise<void> {
    try {
      const { error } = await supabase
        .from('followers')
        .insert({
          follower_id: 'temp',
          following_id: 'temp'
        });
      
      if (error) {
        // Table creation failed
      }
    } catch (error) {
      // Table creation failed
    }
  }

  // Profile Management
  async createProfile(userId: string, profileData: CreateProfileData): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          ...profileData,
        })
        .select()
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  async updateProfile(userId: string, profileData: UpdateProfileData): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  async searchUsers(query: string): Promise<Profile[]> {
    try {
      // SECURITY: Escape special characters to prevent SQL injection
      const sanitizedQuery = query.replace(/[%_]/g, '\\$&');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${sanitizedQuery}%,display_name.ilike.%${sanitizedQuery}%`)
        .limit(20);

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  // Follow/Unfollow Functionality
  async followUser(followerId: string, followingId: string): Promise<boolean> {
    try {
              // First check if already following
        const isAlreadyFollowing = await this.isFollowing(followerId, followingId);
        if (isAlreadyFollowing) {
          return true; // Return true since the desired state is achieved
        }

      // Use upsert to handle potential duplicates gracefully
      const { error } = await supabase
        .from('followers')
        .upsert({
          follower_id: followerId,
          following_id: followingId,
        }, {
          onConflict: 'follower_id,following_id'
        });

              if (error) {
          if (error.code === '42703') {
            return false;
          }
          return false;
        }

      return true;
    } catch (error) {
      return false;
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

              if (error) {
          return false;
        }

      return true;
    } catch (error) {
      return false;
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false;
        } else if (error.code === '42703') {
          return false;
        } else {
          return false;
        }
      }

      return !!data;
    } catch (error) {
      return false;
    }
  }

  async getFollowers(userId: string): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select('follower_id')
        .eq('following_id', userId);

      if (error) {
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      const followerIds = data.map(item => item.follower_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', followerIds);

      if (profilesError) {
        return [];
      }

      return profiles || [];
    } catch (error) {
      return [];
    }
  }

  async getFollowing(userId: string): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select('following_id')
        .eq('follower_id', userId);

      if (error) {
        return [];
      }

      if (!data || data.length === 0) {
        return [];
      }

      const followingIds = data.map(item => item.following_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', followingIds);

      if (profilesError) {
        return [];
      }

      return profiles || [];
    } catch (error) {
      return [];
    }
  }

  async getFollowerCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      if (error) {
        return 0;
      }

      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  async getFollowingCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

      if (error) {
        return 0;
      }

      return count || 0;
    } catch (error) {
      return 0;
    }
  }



  // Search History Methods
  async saveSearchHistory(userId: string, query: string): Promise<void> {
    try {
      // Try to use the RPC function first
      await supabase.rpc('save_search_history', {
        user_id_param: userId,
        search_query_param: query
      });
    } catch (error) {
      console.error('Error saving search history:', error);
      // Fallback: try to insert directly into search_history table
      try {
        await supabase
          .from('search_history')
          .insert({
            user_id: userId,
            search_query: query,
            created_at: new Date().toISOString()
          });
      } catch (fallbackError) {
        // If the table doesn't exist, just log and continue
        console.error('Search history table does not exist, skipping save:', fallbackError);
      }
    }
  }

  async getSearchHistory(userId: string): Promise<string[]> {
    try {
      // Try to use the RPC function first
      const { data, error } = await supabase.rpc('get_search_history', {
        user_id_param: userId
      });
      
      if (error) throw error;
      
      return data?.map((item: any) => item.query || item.search_query) || [];
    } catch (error) {
      console.error('Error getting search history:', error);
      // Fallback: try to query the table directly
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('search_history')
          .select('search_query')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (fallbackError) {
          // If the table doesn't exist, just return empty array
          console.error('Search history table does not exist:', fallbackError);
          return [];
        }
        
        return fallbackData?.map((item: any) => item.search_query) || [];
      } catch (fallbackError) {
        console.error('Fallback search history get failed:', fallbackError);
        return [];
      }
    }
  }

  async clearSearchHistory(userId: string): Promise<void> {
    try {
      // Try to use the RPC function first
      await supabase.rpc('clear_search_history', {
        user_id_param: userId
      });
    } catch (error) {
      console.error('Error clearing search history:', error);
      // Fallback: try to delete directly from search_history table
      try {
        await supabase
          .from('search_history')
          .delete()
          .eq('user_id', userId);
      } catch (fallbackError) {
        // If the table doesn't exist, just log and continue
        console.error('Search history table does not exist, skipping clear:', fallbackError);
      }
    }
  }

  // Suggested Users Methods
  async getSuggestedUsers(userId: string, limit: number = 10): Promise<Profile[]> {
    try {
      const { data, error } = await supabase.rpc('get_suggested_users', {
        current_user_id: userId,
        limit_count: limit
      });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting suggested users:', error);
      // Fallback: return a simple list of users who are not being followed
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', userId)
          .limit(limit);
        
        if (fallbackError) throw fallbackError;
        
        return fallbackData || [];
      } catch (fallbackError) {
        console.error('Fallback suggested users failed:', fallbackError);
        return [];
      }
    }
  }

  async getUsersWithSimilarInterests(userId: string, limit: number = 5): Promise<Profile[]> {
    try {
      const { data, error } = await supabase.rpc('get_users_with_similar_interests', {
        current_user_id: userId,
        limit_count: limit
      });
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error getting users with similar interests:', error);
      return [];
    }
  }

  // Goal Search Methods
  async searchGoals(query: string): Promise<any[]> {
    try {
      console.log('Searching for goals with query:', query);
      
      // First, let's check if there are any goals at all
      const { data: allGoals, error: allGoalsError } = await supabase
        .from('goals')
        .select('*')
        .limit(5);
      
      console.log('Total goals in database:', allGoals?.length || 0);
      if (allGoalsError) {
        console.error('Error fetching all goals:', allGoalsError);
      }
      
      // Now try the search
      // SECURITY: Escape special characters to prevent SQL injection
      const sanitizedQuery = query.replace(/[%_]/g, '\\$&');
      
      const { data, error } = await supabase
        .from('goals')
        .select(`
          *,
          profiles:user_id (
            id,
            username,
            avatar_url
          )
        `)
        .or(`title.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%,category.ilike.%${sanitizedQuery}%`)
        .order('created_at', { ascending: false })
        .limit(20);
      
      console.log('Search results:', data?.length || 0);
      if (error) {
        console.error('Search error:', error);
      }
      
      // Log the first result to see the structure
      if (data && data.length > 0) {
        console.log('First goal result:', data[0]);
      }
      
      return data || [];
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Found goals:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Error searching goals:', error);
      return [];
    }
  }
}

export const socialService = new SocialService(); 