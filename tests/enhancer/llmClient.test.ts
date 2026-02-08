import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createLlmClient } from '../../src/enhancer/llmClient.js';
import type { EnhancerConfig } from '../../src/config.js';

describe('createLlmClient', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    // Provide a mock fetch so adapter constructors don't fail
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'mock' } }],
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should throw when model is not set', async () => {
    const config: EnhancerConfig = {
      endpoint: 'openai',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      apiKey: 'test-key',
      model: undefined,
    };

    await expect(createLlmClient(config)).rejects.toThrow('model is required');
  });

  it('should create OpenAI adapter for openai endpoint', async () => {
    const config: EnhancerConfig = {
      endpoint: 'openai',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      apiKey: 'test-key',
      model: 'gpt-4o-mini',
    };

    const client = await createLlmClient(config);
    expect(client).toBeDefined();
    expect(typeof client.chat).toBe('function');
  });

  it('should create Claude adapter for claude endpoint', async () => {
    const config: EnhancerConfig = {
      endpoint: 'claude',
      baseUrl: 'https://api.anthropic.com/v1/messages',
      apiKey: 'test-key',
      model: 'claude-sonnet-4-20250514',
    };

    const client = await createLlmClient(config);
    expect(client).toBeDefined();
    expect(typeof client.chat).toBe('function');
  });

  it('should create Gemini adapter for gemini endpoint', async () => {
    const config: EnhancerConfig = {
      endpoint: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      apiKey: 'test-key',
      model: 'gemini-2.0-flash',
    };

    const client = await createLlmClient(config);
    expect(client).toBeDefined();
    expect(typeof client.chat).toBe('function');
  });

  it('should cache clients with same config', async () => {
    const config: EnhancerConfig = {
      endpoint: 'openai',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      apiKey: 'test-key',
      model: 'gpt-4o-mini-cached-test',
    };

    const client1 = await createLlmClient(config);
    const client2 = await createLlmClient(config);
    expect(client1).toBe(client2); // Same reference (cached)
  });
});
