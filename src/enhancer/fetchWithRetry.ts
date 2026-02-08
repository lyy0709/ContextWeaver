import { logger } from '../utils/logger.js';

export interface RetryOptions {
  /** Per-request timeout in milliseconds (default: 90000) */
  timeoutMs?: number;
  /** Maximum number of retries after initial attempt (default: 2) */
  maxRetries?: number;
  /** Base delay for exponential backoff in ms (default: 300) */
  baseDelayMs?: number;
  /** Maximum delay cap in ms (default: 5000) */
  maxDelayMs?: number;
}

const DEFAULT_TIMEOUT_MS = 90_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BASE_DELAY_MS = 300;
const DEFAULT_MAX_DELAY_MS = 5_000;

function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

function computeDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponential = baseDelay * Math.pow(2, attempt);
  const capped = Math.min(exponential, maxDelay);
  // Add jitter: random value in [0, baseDelay]
  const jitter = Math.random() * baseDelay;
  return capped + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with timeout (AbortController) and retry for transient errors.
 *
 * Retries on:
 * - Network errors (fetch throws)
 * - HTTP 429 (rate limit)
 * - HTTP 5xx (server error)
 *
 * Does NOT retry on:
 * - HTTP 4xx (except 429) — client errors are not transient
 */
export async function fetchWithRetry(
  url: string,
  init: RequestInit,
  opts: RetryOptions = {},
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseDelayMs = opts.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
  const maxDelayMs = opts.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (isRetryableStatus(response.status) && attempt < maxRetries) {
        // Release the response body to free the underlying socket for reuse
        try { await response.body?.cancel(); } catch { /* ignore */ }

        logger.warn(
          { status: response.status, attempt: attempt + 1, maxRetries },
          `LLM API returned ${response.status}, retrying...`,
        );
        const delay = computeDelay(attempt, baseDelayMs, maxDelayMs);
        await sleep(delay);
        continue;
      }

      return response;
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < maxRetries) {
        const isAbort = lastError.name === 'AbortError';
        logger.warn(
          { error: lastError.message, attempt: attempt + 1, maxRetries, isAbort },
          `LLM API request failed, retrying...`,
        );
        const delay = computeDelay(attempt, baseDelayMs, maxDelayMs);
        await sleep(delay);
        continue;
      }
    }
  }

  throw lastError ?? new Error('fetchWithRetry: all attempts failed');
}
