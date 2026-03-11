import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

// Debug: Log what we're getting from @env
console.log('🔍 Environment variables check:');
console.log('SUPABASE_URL:', SUPABASE_URL ? `${SUPABASE_URL.substring(0, 20)}...` : 'undefined');
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : 'undefined');

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const missingVars = [];
  if (!SUPABASE_URL) missingVars.push('SUPABASE_URL');
  if (!SUPABASE_ANON_KEY) missingVars.push('SUPABASE_ANON_KEY');
  
  console.error('❌ Missing environment variables:', missingVars);
  console.error('💡 Make sure:');
  console.error('   1. .env file exists in the root directory');
  console.error('   2. Variables are named exactly: SUPABASE_URL and SUPABASE_ANON_KEY');
  console.error('   3. No spaces around the = sign (e.g., SUPABASE_URL=https://...)');
  console.error('   4. Metro bundler cache is cleared (npm start -- --reset-cache)');
  
  throw new Error(
    `Missing required environment variables: ${missingVars.join(', ')}\n` +
    `Please check your .env file in the root directory.\n` +
    `After updating .env, restart with: npm start -- --reset-cache`
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
}); 