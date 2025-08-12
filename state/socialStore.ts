import { create } from 'zustand';
import { socialService, Profile } from '../lib/socialService';

interface SocialState {
  // State
  followers: Profile[];
  following: Profile[];
  suggestedUsers: Profile[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchFollowers: (userId: string) => Promise<void>;
  fetchFollowing: (userId: string) => Promise<void>;
  fetchSuggestedUsers: (userId: string) => Promise<void>;
  followUser: (followerId: string, followingId: string) => Promise<boolean>;
  unfollowUser: (followerId: string, followingId: string) => Promise<boolean>;
  searchUsers: (query: string) => Promise<Profile[]>;
  clearError: () => void;
  reset: () => void;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  // Initial state
  followers: [],
  following: [],
  suggestedUsers: [],
  isLoading: false,
  error: null,

  // Actions
  fetchFollowers: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const followers = await socialService.getFollowers(userId);
      set({ followers, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch followers', 
        isLoading: false 
      });
    }
  },

  fetchFollowing: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const following = await socialService.getFollowing(userId);
      set({ following, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch following', 
        isLoading: false 
      });
    }
  },

  fetchSuggestedUsers: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const suggestedUsers = await socialService.getSuggestedUsers(userId);
      set({ suggestedUsers, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch suggested users', 
        isLoading: false 
      });
    }
  },

  followUser: async (followerId: string, followingId: string) => {
    set({ isLoading: true, error: null });
    try {
      const success = await socialService.followUser(followerId, followingId);
      if (success) {
        // Update local state
        const newFollowing = await socialService.getFollowing(followerId);
        set({ following: newFollowing, isLoading: false });
      } else {
        set({ 
          error: 'Failed to follow user', 
          isLoading: false 
        });
      }
      return success;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to follow user', 
        isLoading: false 
      });
      return false;
    }
  },

  unfollowUser: async (followerId: string, followingId: string) => {
    set({ isLoading: true, error: null });
    try {
      const success = await socialService.unfollowUser(followerId, followingId);
      if (success) {
        // Update local state
        const newFollowing = await socialService.getFollowing(followerId);
        set({ following: newFollowing, isLoading: false });
      } else {
        set({ 
          error: 'Failed to unfollow user', 
          isLoading: false 
        });
      }
      return success;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to unfollow user', 
        isLoading: false 
      });
      return false;
    }
  },

  searchUsers: async (query: string) => {
    set({ isLoading: true, error: null });
    try {
      const users = await socialService.searchUsers(query);
      set({ isLoading: false });
      return users;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to search users', 
        isLoading: false 
      });
      return [];
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      followers: [],
      following: [],
      suggestedUsers: [],
      isLoading: false,
      error: null,
    });
  },
})); 