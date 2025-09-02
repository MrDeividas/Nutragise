// Configuration for API keys and environment variables
export const config = {
  // DeepSeek API Configuration
  deepseek: {
    apiKey: '', // Will be set dynamically
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    model: 'deepseek-chat',
    maxTokens: 500,
    temperature: 0.7,
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
  },
};

// Helper function to check if API key is configured
export const isApiKeyConfigured = (): boolean => {
  return config.deepseek.apiKey.length > 0;
};

// Helper function to get API key with validation
export const getApiKey = (): string => {
  if (!isApiKeyConfigured()) {
    throw new Error('DeepSeek API key not configured. Please set the API key using setApiKey().');
  }
  return config.deepseek.apiKey;
};

// Function to set the API key
export const setApiKey = (apiKey: string): void => {
  config.deepseek.apiKey = apiKey;
};

// Initialize with the provided API key
export const initializeAI = (): void => {
  setApiKey('sk-641a791ecb6d48e3bbc3f41711c7646c');
};
