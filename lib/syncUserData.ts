import { supabase } from './supabase';

export const syncUserEmail = async (userId: string) => {
  try {
    // Get the current user from auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return false;
    }
    
    // Update the users table with the email
    const { error: updateError } = await supabase
      .from('users')
      .update({ email: authUser.email })
      .eq('id', userId);
    
    if (updateError) {
      return false;
    }
    
    return true;
    
  } catch (error) {
    return false;
  }
};

export const syncAllUserData = async () => {
  try {
    // Get current auth user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      return false;
    }
    
    // Update users table
    const { error: usersError } = await supabase
      .from('users')
      .upsert({
        id: authUser.id,
        email: authUser.email,
        username: authUser.email?.split('@')[0] || 'user'
      });
    
    if (usersError) {
      return false;
    }
    
    // Update profiles table
    const { error: profilesError } = await supabase
      .from('profiles')
      .upsert({
        id: authUser.id,
        username: authUser.email?.split('@')[0] || 'user',
        display_name: authUser.email?.split('@')[0] || 'User'
      });
    
    if (profilesError) {
      return false;
    }
    
    return true;
    
  } catch (error) {
    return false;
  }
}; 