import Constants from 'expo-constants';

type AppExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  stripePublishableKey?: string;
  revenueCatIosApiKey?: string;
  revenueCatAndroidApiKey?: string;
  deepseekApiKey?: string;
};

function getExtra(): AppExtra {
  return (Constants.expoConfig?.extra ?? {}) as AppExtra;
}

function read(value: string | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Build-time env embedded via app.config.js → expo.extra.
 * Prefer this over `@env` for store/TestFlight builds.
 */
export const env = {
  get supabaseUrl() {
    return read(getExtra().supabaseUrl);
  },
  get supabaseAnonKey() {
    return read(getExtra().supabaseAnonKey);
  },
  get stripePublishableKey() {
    return read(getExtra().stripePublishableKey);
  },
  get revenueCatIosApiKey() {
    return read(getExtra().revenueCatIosApiKey);
  },
  get revenueCatAndroidApiKey() {
    return read(getExtra().revenueCatAndroidApiKey);
  },
  get deepseekApiKey() {
    return read(getExtra().deepseekApiKey);
  },
};

export function getMissingRequiredEnv(): string[] {
  const missing: string[] = [];
  if (!env.supabaseUrl) missing.push('SUPABASE_URL');
  if (!env.supabaseAnonKey) missing.push('SUPABASE_ANON_KEY');
  return missing;
}
