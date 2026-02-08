import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiAdapter } from '../../../src/enhancer/adapters/gemini.js';

describe('GeminiAdapter', () => {
  const config = {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKey: 'test-gemini-key',
    model: 'gemini-2.0-flash',
  };

  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should construct correct URL with API key', async () => {
    let capturedUrl = '';

    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      capturedUrl = url.toString();
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'result' }] } }],
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const adapter = new GeminiAdapter(config);
    await adapter.chat([{ role: 'user', content: 'test' }]);

    expect(capturedUrl).toContain('/v1beta/models/gemini-2.0-flash:generateContent');
    expect(capturedUrl).toContain('key=test-gemini-key');
  });

  it('should handle duplicate /v1beta in baseUrl', async () => {
    let capturedUrl = '';

    globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
      capturedUrl = url.toString();
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'result' }] } }],
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const adapter = new GeminiAdapter({
      ...config,
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    });
    await adapter.chat([{ role: 'user', content: 'test' }]);

    // Should not have /v1beta/v1beta
    const v1betaCount = (capturedUrl.match(/v1beta/g) || []).length;
    expect(v1betaCount).toBe(1);
  });

  it('should convert assistant role to model role', async () => {
    let capturedBody: Record<string, unknown> = {};

    globalThis.fetch = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'result' }] } }],
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const adapter = new GeminiAdapter(config);
    await adapter.chat([
      { role: 'system', content: 'System instruction' },
      { role: 'user', content: 'User message' },
      { role: 'assistant', content: 'Assistant reply' },
    ]);

    // System should be extracted to systemInstruction
    expect(capturedBody.systemInstruction).toEqual({
      parts: [{ text: 'System instruction' }],
    });

    // Contents should only have user and model (not system, not assistant)
    const contents = capturedBody.contents as Array<{ role: string }>;
    expect(contents).toHaveLength(2);
    expect(contents[0].role).toBe('user');
    expect(contents[1].role).toBe('model');
  });

  it('should return text from successful response', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          candidates: [{ content: { parts: [{ text: 'Gemini enhanced prompt' }] } }],
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    const adapter = new GeminiAdapter(config);
    const result = await adapter.chat([{ role: 'user', content: 'test' }]);
    expect(result).toBe('Gemini enhanced prompt');
  });

  it('should throw on error response', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({ error: { message: 'Invalid key' } }),
        { status: 400 },
      ),
    ) as unknown as typeof fetch;

    const adapter = new GeminiAdapter(config);
    await expect(
      adapter.chat([{ role: 'user', content: 'test' }]),
    ).rejects.toThrow('Gemini API');
  });

  it('should throw when response content is empty', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ candidates: [] }), { status: 200 }),
    ) as unknown as typeof fetch;

    const adapter = new GeminiAdapter(config);
    await expect(
      adapter.chat([{ role: 'user', content: 'test' }]),
    ).rejects.toThrow('Gemini API 返回为空');
  });
});
