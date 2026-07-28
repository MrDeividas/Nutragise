import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env, getMissingRequiredEnv } from './env';

const supabaseUrl = env.supabaseUrl;
const supabaseAnonKey = env.supabaseAnonKey;

export const supabaseConfigError: string | null = (() => {
  const missing = getMissingRequiredEnv();
  if (missing.length > 0) {
    return (
      `Missing required configuration: ${missing.join(', ')}. ` +
      'Rebuild with EAS production environment variables set.'
    );
  }
  const placeholder =
    /your_.*key|YOUR_.*KEY|placeholder|changeme/i.test(supabaseAnonKey) ||
    supabaseAnonKey.length < 20;
  if (placeholder || !(supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.startsWith('sb_'))) {
    return 'SUPABASE_ANON_KEY is invalid. Use the anon public key from Supabase → Settings → API.';
  }
  return null;
})();

if (supabaseConfigError) {
  console.error('❌ Supabase config error:', supabaseConfigError);
}

// Always create a client so imports don't crash the native shell.
// Calls will fail until env is fixed — App shows a config error screen.
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder',
  {
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
