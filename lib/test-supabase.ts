import { supabase } from './supabase';

export async function testSupabaseConnection() {
  try {
    // Test basic connection by getting the current user (should be null if not authenticated)
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    
    console.log('Supabase connection successful!');
    console.log('Current user:', user);
    return true;
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    return false;
  }
} 