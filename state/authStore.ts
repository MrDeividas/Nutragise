import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { socialService } from '../lib/socialService';
import { AuthState, User, SignUpData, SignInData, ProfileData } from '../types/auth';

interface AuthStore extends AuthState {
  signUp: (data: SignUpData) => Promise<{ error: any | null }>;
  signIn: (data: SignInData) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: ProfileData) => Promise<{ error: any | null }>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  session: null,
  loading: true,

  initialize: async () => {
    try {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Fetch user profile from our users table
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        // Also check if profile exists, create if not
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!profileData && userData) {
          // Create profile if it doesn't exist
          await socialService.createProfile(session.user.id, {
            username: userData.username || userData.email?.split('@')[0] || 'user',
            display_name: userData.username || userData.email?.split('@')[0] || 'User',
            bio: userData.bio,
            avatar_url: userData.avatar_url
          });
        }

        const userToSet = userData || {
          id: session.user.id,
          email: session.user.email!,
          created_at: session.user.created_at
        };
        
        set({
          user: userToSet,
          session,
          loading: false
        });
      } else {
        set({ user: null, session: null, loading: false });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          // Also check if profile exists, create if not
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (!profileData && userData) {
            // Create profile if it doesn't exist
            await socialService.createProfile(session.user.id, {
              username: userData.username || userData.email?.split('@')[0] || 'user',
              display_name: userData.username || userData.email?.split('@')[0] || 'User',
              bio: userData.bio,
              avatar_url: userData.avatar_url
            });
          }

          set({
            user: userData || {
              id: session.user.id,
              email: session.user.email!,
              created_at: session.user.created_at
            },
            session
          });
        } else {
          set({ user: null, session: null });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ loading: false });
    }
  },

  signUp: async (data: SignUpData) => {
    try {
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password
      });

      if (error) return { error };

      // Insert user into users table immediately after successful sign up
      const user = signUpData?.user;
      if (user) {
        await supabase.from('users').upsert({
          id: user.id,
          email: user.email
        });
        
        // Also create a profile record for social features
        await socialService.createProfile(user.id, {
          username: user.email?.split('@')[0] || 'user',
          display_name: user.email?.split('@')[0] || 'User'
        });
      }
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  signIn: async (data: SignInData) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      return { error };
    } catch (error) {
      return { error };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },

  updateProfile: async (data: ProfileData) => {
    try {
      const { user } = get();
      if (!user) return { error: new Error('No user logged in') };

      // Update users table
      const { error: usersError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          username: data.username,
          bio: data.bio,
          avatar_url: data.avatar_url
        });

      // Update profiles table for social features
      const { error: profilesError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: data.username,
          display_name: data.username,
          bio: data.bio,
          avatar_url: data.avatar_url
        });

      if (!usersError && !profilesError) {
        // Fetch fresh user data from database
        const { data: freshUserData, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!fetchError && freshUserData) {
          set({
            user: freshUserData
          });
        } else {
          set({
            user: {
              ...user,
              username: data.username,
              bio: data.bio,
              avatar_url: data.avatar_url
            }
          });
        }
      }

      return { error: usersError || profilesError };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error };
    }
  }
})); 