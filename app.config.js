/**
 * Dynamic Expo config — embeds EAS/local env into `extra` at build time.
 *
 * This is more reliable for TestFlight/store builds than react-native-dotenv alone,
 * because `.env` is gitignored and EAS injects secrets into process.env during
 * config evaluation and native builds.
 */
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] == null) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const appJson = require('./app.json');

module.exports = () => {
  const expo = appJson.expo;

  return {
    ...expo,
    extra: {
      ...expo.extra,
      supabaseUrl: process.env.SUPABASE_URL ?? '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? '',
      revenueCatIosApiKey: process.env.REVENUECAT_IOS_API_KEY ?? '',
      revenueCatAndroidApiKey: process.env.REVENUECAT_ANDROID_API_KEY ?? '',
    },
  };
};
