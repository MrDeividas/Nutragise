// Non-secret app configuration. DeepSeek API keys live only on the Edge Function.
import { env } from './env';

export const config = {
  deepseek: {
    /** Proxied via supabase/functions/deepseek-chat — never call DeepSeek from the client. */
    model: 'deepseek-chat',
    maxTokens: 350,
    temperature: 0.4,
    frequencyPenalty: 0.6,
    presencePenalty: 0.3,
  },

  stripe: {
    publishableKey: env.stripePublishableKey || '',
  },

  app: {
    name: 'Neutro',
    version: '1.0.0',
  },

  features: {
    aiAssistant: true,
    progressCharts: true,
    correlations: true,
    recommendations: true,
    walletInvestments: true,
  },
};

/** Kept for call-site compatibility; AI now uses the authenticated edge proxy. */
export const isApiKeyConfigured = (): boolean => true;

/** No-op — DeepSeek key must not be loaded into the app. */
export const initializeAI = (): void => {
  if (__DEV__) {
    console.log('✅ Insights AI uses authenticated deepseek-chat edge function');
  }
};
