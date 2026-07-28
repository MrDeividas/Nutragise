import Constants from 'expo-constants';

type AppExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  stripePublishableKey?: string;
  revenueCatIosApiKey?: string;
  revenueCatAndroidApiKey?: string;
  deepseekApiKey?: string;
};

/**
 * Read expo.extra from every place store/TestFlight builds may put it.
 * With expo-updates enabled, Constants.expoConfig can be empty while the
 * embedded manifest still has the values from app.config.js.
 */
function getExtra(): AppExtra {
  const anyConstants = Constants as any;
  const candidates = [
    Constants.expoConfig?.extra,
    anyConstants.manifest2?.extra,
    anyConstants.manifest?.extra,
    anyConstants.easConfig?.extra,
    anyConstants.manifest2?.extra?.expoClient?.extra,
    anyConstants.manifest?.extra?.expoClient?.extra,
  ];

  for (const extra of candidates) {
    if (extra && typeof extra === 'object') {
      return extra as AppExtra;
    }
  }
  return {};
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
