// Configuration for API keys and environment variables
import { env } from './env';
export const config = {
  // DeepSeek API Configuration
  deepseek: {
    apiKey: '', // Will be set dynamically
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    maxTokens: 350,
    temperature: 0.4,
    frequencyPenalty: 0.6,
    presencePenalty: 0.3,
  },
  
  // Stripe Configuration
  stripe: {
    publishableKey: env.stripePublishableKey || '',
  },
  
  // App Configuration
  app: {
    name: 'Neutro',
    version: '1.0.0',
  },
  
  // Feature Flags
  features: {
    aiAssistant: true,
    progressCharts: true,
    correlations: true,
    recommendations: true,
    walletInvestments: true, // New feature flag for wallet/investment system
  },
};

// Helper function to check if API key is configured
const PLACEHOLDER_KEYS = new Set([
  '',
  'your_deepseek_api_key',
  'YOUR_DEEPSEEK_API_KEY',
  'changeme',
  'replace_me',
]);

export const isApiKeyConfigured = (): boolean => {
  const key = config.deepseek.apiKey.trim();
  return key.length > 0 && !PLACEHOLDER_KEYS.has(key);
};

// Helper function to get API key with validation
export const getApiKey = (): string => {
  if (!isApiKeyConfigured()) {
    throw new Error(
      'DeepSeek API key not configured. Set a real DEEPSEEK_API_KEY in .env and restart Expo.'
    );
  }
  return config.deepseek.apiKey.trim();
};

// Function to set the API key
export const setApiKey = (apiKey: string): void => {
  config.deepseek.apiKey = apiKey.trim();
};

// Initialize with the provided API key from environment variables
export const initializeAI = (): void => {
  try {
    const key = env.deepseekApiKey;
    if (key && !PLACEHOLDER_KEYS.has(key)) {
      setApiKey(key);
      console.log('✅ DeepSeek API key loaded from environment variables');
    } else if (key && PLACEHOLDER_KEYS.has(key)) {
      console.warn(
        '⚠️ DEEPSEEK_API_KEY is still a placeholder. Replace it in .env with a real key from https://platform.deepseek.com'
      );
    } else {
      console.warn('⚠️ DEEPSEEK_API_KEY not found in environment variables');
    }
  } catch (error) {
    console.error('❌ Error loading environment variables:', error);
    console.warn('⚠️ Make sure to create a .env file with DEEPSEEK_API_KEY');
  }
};
