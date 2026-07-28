#!/usr/bin/env node
/**
 * Writes .env from environment variables before a build.
 *
 * `.env` is gitignored, so it is not uploaded to EAS Build. The app reads keys
 * through `@env` (react-native-dotenv), which only reads the .env file — so on
 * EAS the file has to be recreated from EAS environment variables.
 *
 * Runs automatically on EAS via the `eas-build-pre-install` npm script.
 * Locally it is a no-op when an existing .env is present.
 */

const fs = require('fs');
const path = require('path');

const KEYS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'REVENUECAT_IOS_API_KEY',
  'REVENUECAT_ANDROID_API_KEY',
  'DEEPSEEK_API_KEY',
];

const REQUIRED = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];

const envPath = path.join(__dirname, '..', '.env');
const isEasBuild = process.env.EAS_BUILD === 'true';

if (!isEasBuild && fs.existsSync(envPath)) {
  console.log('generate-env: local .env found, leaving it untouched.');
  process.exit(0);
}

const present = KEYS.filter((key) => {
  const value = process.env[key];
  return typeof value === 'string' && value.length > 0;
});

const missingRequired = REQUIRED.filter((key) => !present.includes(key));
if (missingRequired.length > 0) {
  console.error(
    `generate-env: missing required environment variables: ${missingRequired.join(', ')}\n` +
      'Set them as EAS environment variables (eas env:create) or in eas.json before building.'
  );
  process.exit(1);
}

const contents = `${present.map((key) => `${key}=${process.env[key]}`).join('\n')}\n`;
fs.writeFileSync(envPath, contents);

console.log(`generate-env: wrote .env with ${present.length} key(s): ${present.join(', ')}`);

const missingOptional = KEYS.filter((key) => !present.includes(key));
if (missingOptional.length > 0) {
  console.warn(`generate-env: not set (features relying on these will be disabled): ${missingOptional.join(', ')}`);
}
