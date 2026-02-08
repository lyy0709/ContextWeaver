import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithRetry } from '../../src/enhancer/fetchWithRetry.js';

// Mock the global fetch
const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('fetchWithRetry', () => {
  it('should return response on success (200)', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const res = await fetchWithRetry('https://api.test.com', { method: 'POST' });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should return 400 without retrying (client error)', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(400, { error: 'bad request' }));

    const res = await fetchWithRetry('https://api.test.com', { method: 'POST' }, {
      maxRetries: 2,
      baseDelayMs: 1,
    });
    expect(res.status).toBe(400);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on 500 and succeed', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(500, { error: 'server error' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const res = await fetchWithRetry('https://api.test.com', { method: 'POST' }, {
      maxRetries: 2,
      baseDelayMs: 1,
    });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should retry on 429 and succeed', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(429, { error: 'rate limited' }))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const res = await fetchWithRetry('https://api.test.com', { method: 'POST' }, {
      maxRetries: 2,
      baseDelayMs: 1,
    });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should retry on network error and succeed', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    const res = await fetchWithRetry('https://api.test.com', { method: 'POST' }, {
      maxRetries: 2,
      baseDelayMs: 1,
    });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should return last response after exhausting retries on 500', async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse(500, {}))
      .mockResolvedValueOnce(jsonResponse(500, {}))
      .mockResolvedValueOnce(jsonResponse(500, {}));

    const res = await fetchWithRetry('https://api.test.com', { method: 'POST' }, {
      maxRetries: 2,
      baseDelayMs: 1,
    });
    expect(res.status).toBe(500);
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should throw after exhausting retries on network error', async () => {
    const error = new Error('persistent network error');
    mockFetch
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error)
      .mockRejectedValueOnce(error);

    await expect(
      fetchWithRetry('https://api.test.com', { method: 'POST' }, {
        maxRetries: 2,
        baseDelayMs: 1,
      }),
    ).rejects.toThrow('persistent network error');
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('should pass abort signal to fetch for timeout', async () => {
    mockFetch.mockImplementation(async (_url: string, init: RequestInit) => {
      expect(init.signal).toBeDefined();
      return jsonResponse(200, { ok: true });
    });

    await fetchWithRetry('https://api.test.com', { method: 'POST' }, {
      timeoutMs: 5000,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should respect maxRetries=0 (no retries)', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(500, {}));

    const res = await fetchWithRetry('https://api.test.com', { method: 'POST' }, {
      maxRetries: 0,
      baseDelayMs: 1,
    });
    expect(res.status).toBe(500);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
