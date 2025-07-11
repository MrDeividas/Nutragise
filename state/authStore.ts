import { create } from 'zustand';
import { supabase } from '../lib/supabase';
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

        set({
          user: userData || {
            id: session.user.id,
            email: session.user.email!,
            created_at: session.user.created_at
          },
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

      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          username: data.username,
          bio: data.bio,
          avatar_url: data.avatar_url
        });

      if (!error) {
        set({
          user: {
            ...user,
            username: data.username,
            bio: data.bio,
            avatar_url: data.avatar_url
          }
        });
      }

      return { error };
    } catch (error) {
      return { error };
    }
  }
})); 