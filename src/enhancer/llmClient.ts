import type { EnhancerConfig } from '../config.js';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmClient {
  chat(messages: LlmMessage[]): Promise<string>;
}

export interface LlmClientConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

const clientCache = new Map<string, LlmClient>();

export async function createLlmClient(config: EnhancerConfig): Promise<LlmClient> {
  const endpoint = config.endpoint;
  const baseUrl = config.baseUrl;
  const model = config.model || '';

  const cacheKey = `${endpoint}:${baseUrl}:${model}`;
  const cached = clientCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  if (!config.model) {
    throw new Error('Prompt enhancer model is required');
  }

  const clientConfig: LlmClientConfig = {
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.model,
  };

  let client: LlmClient;
  if (endpoint === 'openai') {
    const { OpenAiAdapter } = await import('./adapters/openai.js');
    client = new OpenAiAdapter(clientConfig);
  } else if (endpoint === 'claude') {
    const { ClaudeAdapter } = await import('./adapters/claude.js');
    client = new ClaudeAdapter(clientConfig);
  } else {
    const { GeminiAdapter } = await import('./adapters/gemini.js');
    client = new GeminiAdapter(clientConfig);
  }

  clientCache.set(cacheKey, client);
  return client;
}

