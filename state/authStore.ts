import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { socialService } from '../lib/socialService';
import { emailService } from '../lib/emailService';
import { AuthState, User, SignUpData, SignInData, ProfileData } from '../types/auth';

interface AuthStore extends AuthState {
  signUp: (data: SignUpData) => Promise<{ error: any | null }>;
  signIn: (data: SignInData) => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: ProfileData) => Promise<{ error: any | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: any | null }>;
  checkEmailVerification: () => Promise<boolean>;
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
              username: session.user.id,  // Use unique user ID as username (random UUID)
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

      if (error) {
        // Parse email errors to detect bounces
        const emailError = emailService.parseEmailError(error);
        const friendlyMessage = emailService.getErrorMessage(emailError);
        
        // Return enhanced error with bounce detection
        return { 
          error: { 
            ...error, 
            message: friendlyMessage,
            isBounce: emailError.isBounce,
            isInvalidEmail: emailError.isInvalidEmail
          } 
        };
      }

      // Insert user into users table immediately after successful sign up
      const user = signUpData?.user;
      if (user) {
        console.log('👤 Creating user and profile for:', user.id, user.email);
        
        await supabase.from('users').upsert({
          id: user.id,
          email: user.email
        });
        
        // Also create a profile record for social features with onboarding_completed = false
        const profile = await socialService.createProfile(user.id, {
          username: user.id,  // Use unique user ID as username (random UUID)
          display_name: user.email?.split('@')[0] || 'User',
          onboarding_completed: false
        });
        
        if (!profile) {
          console.error('❌ Failed to create profile for user:', user.id);
          // Try direct insert as fallback
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: user.id,  // Use unique user ID as username (random UUID)
              display_name: user.email?.split('@')[0] || 'User',
              onboarding_completed: false
            });
          
          if (profileError) {
            console.error('❌ Profile creation error:', profileError);
          } else {
            console.log('✅ Profile created via fallback');
          }
        } else {
          console.log('✅ Profile created successfully');
        }

        // Update the store immediately with the new user
        set({
          user: {
            id: user.id,
            email: user.email!,
            created_at: user.created_at
          },
          session: signUpData.session,
          loading: false
        });
      }
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  signIn: async (data: SignInData) => {
    try {
      console.log('🔐 Attempting sign-in for:', data.email);
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error) {
        console.error('❌ Sign-in error:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        return { error };
      }

      console.log('✅ Sign-in successful. User email confirmed?', signInData?.user?.email_confirmed_at ? 'Yes' : 'No');

      // Set user state immediately after successful sign-in
      if (signInData?.user) {
        console.log('✅ Sign-in successful for user:', signInData.user.id);
        
        // Fetch user data from database
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', signInData.user.id)
          .single();

        // Set user state immediately
        set({
          user: userData || {
            id: signInData.user.id,
            email: signInData.user.email!,
            created_at: signInData.user.created_at
          },
          session: signInData.session
        });
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
    
    // Note: actionStore will be cleared by the component that uses it
    // when it detects the user is null
  },

  updateProfile: async (data: ProfileData) => {
    try {
      const { user } = get();
      if (!user) return { error: new Error('No user logged in') };

      // Try to update users table, but don't fail if it's blocked by RLS
      // The profiles table is what's actually used for social features
      let usersError = null;
      try {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (existingUser) {
          // User exists, use UPDATE
          const { error: updateError } = await supabase
            .from('users')
            .update({
              username: data.username,
              bio: data.bio,
              avatar_url: data.avatar_url
            })
            .eq('id', user.id);

          if (updateError) {
            console.warn('⚠️ Failed to update users table (RLS may be blocking):', updateError.message);
            usersError = updateError;
          }
        } else {
          // User doesn't exist, try INSERT (may fail due to RLS, but that's okay)
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              username: data.username,
              bio: data.bio,
              avatar_url: data.avatar_url
            });
          
          if (insertError) {
            console.warn('⚠️ Failed to insert into users table (RLS may be blocking):', insertError.message);
            usersError = insertError;
          }
        }
      } catch (usersTableError: any) {
        console.warn('⚠️ Error accessing users table (RLS may be blocking):', usersTableError?.message);
        usersError = usersTableError;
      }

      // Update profiles table for social features (this is the critical one)
      const { error: profilesError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: data.username,
          display_name: data.username,
          bio: data.bio,
          avatar_url: data.avatar_url
        });

      // Only fail if profiles update fails - users table is secondary
      if (profilesError) {
        return { error: profilesError };
      }

      // Update local state with new data even if users table update failed
      set({
        user: {
          ...user,
          username: data.username,
          bio: data.bio,
          avatar_url: data.avatar_url
        }
      });

      // Try to fetch fresh user data, but don't fail if it's blocked
      try {
        const { data: freshUserData, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!fetchError && freshUserData) {
          set({
            user: freshUserData
          });
        }
      } catch (fetchError) {
        // Ignore fetch errors - we've already updated local state
        console.warn('⚠️ Could not fetch fresh user data:', fetchError);
      }

      // Return success even if users table update failed (profiles is what matters)
      return { error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error };
    }
  },

  resendVerificationEmail: async (email: string) => {
    try {
      const result = await emailService.resendVerificationEmail(email);
      
      if (result.error) {
        // Return a user-friendly error message
        const friendlyMessage = emailService.getErrorMessage(result.error);
        return { error: { ...result.error, message: friendlyMessage } };
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  },

  checkEmailVerification: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.email_confirmed_at !== null;
    } catch {
      return false;
    }
  }
})); 