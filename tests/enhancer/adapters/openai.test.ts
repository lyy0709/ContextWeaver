import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpenAiAdapter } from '../../../src/enhancer/adapters/openai.js';

describe('OpenAiAdapter', () => {
  const config = {
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    apiKey: 'test-key',
    model: 'gpt-4o-mini',
  };

  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should send correct request format', async () => {
    let capturedUrl = '';
    let capturedInit: RequestInit | undefined;

    globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = url.toString();
      capturedInit = init;
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Enhanced result' } }],
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const adapter = new OpenAiAdapter(config);
    await adapter.chat([
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Enhance this prompt' },
    ]);

    expect(capturedUrl).toBe('https://api.openai.com/v1/chat/completions');
    const body = JSON.parse(capturedInit?.body as string);
    expect(body.model).toBe('gpt-4o-mini');
    expect(body.messages).toHaveLength(2);
    expect(body.temperature).toBe(0.3);
    expect(body.stop).toContain('<cw-end/>');

    const headers = capturedInit?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer test-key');
  });

  it('should return content from successful response', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Enhanced prompt text' } }],
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    const adapter = new OpenAiAdapter(config);
    const result = await adapter.chat([{ role: 'user', content: 'test' }]);
    expect(result).toBe('Enhanced prompt text');
  });

  it('should throw on API error response', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({ error: { message: 'Invalid API key' } }),
        { status: 401 },
      ),
    ) as unknown as typeof fetch;

    const adapter = new OpenAiAdapter(config);
    await expect(
      adapter.chat([{ role: 'user', content: 'test' }]),
    ).rejects.toThrow('OpenAI API');
  });

  it('should throw when response content is empty', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ choices: [] }), { status: 200 }),
    ) as unknown as typeof fetch;

    const adapter = new OpenAiAdapter(config);
    await expect(
      adapter.chat([{ role: 'user', content: 'test' }]),
    ).rejects.toThrow('OpenAI API 返回为空');
  });
});
