export interface AIServiceConfig {
  provider: 'local' | 'openai' | 'anthropic' | 'groq' | 'ollama';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  fallbackToLocal: boolean;
  maxRetries: number;
  timeout: number;
}

export const AI_SERVICE_CONFIGS: Record<string, AIServiceConfig> = {
  // Local AI - No setup required, works offline
  local: {
    provider: 'local',
    fallbackToLocal: false,
    maxRetries: 0,
    timeout: 5000,
  },

  // OpenAI - Requires API key, excellent quality
  openai: {
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
    fallbackToLocal: true,
    maxRetries: 2,
    timeout: 10000,
  },

  // Anthropic Claude - Requires API key, excellent for reasoning
  anthropic: {
    provider: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-haiku-20240307',
    fallbackToLocal: true,
    maxRetries: 2,
    timeout: 10000,
  },

  // Groq - Fast inference, requires API key
  groq: {
    provider: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama3-8b-8192',
    fallbackToLocal: true,
    maxRetries: 2,
    timeout: 8000,
  },

  // Ollama - Local LLM server
  ollama: {
    provider: 'ollama',
    baseUrl: 'http://localhost:11434/v1',
    model: 'llama2',
    fallbackToLocal: true,
    maxRetries: 1,
    timeout: 15000,
  },
};

export const DEFAULT_CONFIG: AIServiceConfig = AI_SERVICE_CONFIGS.local;

// Environment variable names for API keys
export const ENV_KEYS = {
  OPENAI_API_KEY: 'VITE_OPENAI_API_KEY',
  ANTHROPIC_API_KEY: 'VITE_ANTHROPIC_API_KEY',
  GROQ_API_KEY: 'VITE_GROQ_API_KEY',
} as const;

// Cost per 1K tokens (approximate, for reference)
export const COST_ESTIMATES = {
  local: { input: 0, output: 0 }, // Free
  openai: { input: 0.0015, output: 0.002 }, // GPT-3.5 Turbo
  anthropic: { input: 0.00025, output: 0.00125 }, // Claude 3 Haiku
  groq: { input: 0.0001, output: 0.0001 }, // Very cheap
  ollama: { input: 0, output: 0 }, // Free (self-hosted)
} as const;