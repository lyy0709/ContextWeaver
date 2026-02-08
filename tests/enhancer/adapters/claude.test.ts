import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClaudeAdapter } from '../../../src/enhancer/adapters/claude.js';

describe('ClaudeAdapter', () => {
  const config = {
    baseUrl: 'https://api.anthropic.com/v1/messages',
    apiKey: 'test-claude-key',
    model: 'claude-sonnet-4-20250514',
  };

  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should separate system messages from user/assistant messages', async () => {
    let capturedBody: Record<string, unknown> = {};

    globalThis.fetch = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      capturedBody = JSON.parse(init?.body as string);
      return new Response(
        JSON.stringify({
          content: [{ type: 'text', text: 'Enhanced result' }],
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const adapter = new ClaudeAdapter(config);
    await adapter.chat([
      { role: 'system', content: 'You are helpful.' },
      { role: 'user', content: 'Enhance this' },
      { role: 'assistant', content: 'Sure' },
      { role: 'user', content: 'More context' },
    ]);

    expect(capturedBody.system).toBe('You are helpful.');
    expect(capturedBody.messages).toHaveLength(3); // user, assistant, user (no system)
    expect(capturedBody.max_tokens).toBe(4096);
    expect(capturedBody.temperature).toBe(0.7);
  });

  it('should set correct headers including anthropic-version', async () => {
    let capturedHeaders: Record<string, string> = {};

    globalThis.fetch = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return new Response(
        JSON.stringify({
          content: [{ type: 'text', text: 'result' }],
        }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;

    const adapter = new ClaudeAdapter(config);
    await adapter.chat([{ role: 'user', content: 'test' }]);

    expect(capturedHeaders['x-api-key']).toBe('test-claude-key');
    expect(capturedHeaders['anthropic-version']).toBe('2023-06-01');
    expect(capturedHeaders['Content-Type']).toBe('application/json');
  });

  it('should return text from successful response', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          content: [{ type: 'text', text: 'Claude enhanced prompt' }],
        }),
        { status: 200 },
      ),
    ) as unknown as typeof fetch;

    const adapter = new ClaudeAdapter(config);
    const result = await adapter.chat([{ role: 'user', content: 'test' }]);
    expect(result).toBe('Claude enhanced prompt');
  });

  it('should throw on error response', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({ error: { message: 'Unauthorized' } }),
        { status: 401 },
      ),
    ) as unknown as typeof fetch;

    const adapter = new ClaudeAdapter(config);
    await expect(
      adapter.chat([{ role: 'user', content: 'test' }]),
    ).rejects.toThrow('Claude API');
  });

  it('should throw when response content is empty', async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ content: [] }), { status: 200 }),
    ) as unknown as typeof fetch;

    const adapter = new ClaudeAdapter(config);
    await expect(
      adapter.chat([{ role: 'user', content: 'test' }]),
    ).rejects.toThrow('Claude API 返回为空');
  });
});
