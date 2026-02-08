import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import http from 'node:http';
import net from 'node:net';

import { getEnhancerWebUiTimeoutMs } from '../config.js';
import { logger } from '../utils/logger.js';
import { enhancePrompt, type EnhanceResult } from './index.js';
import { getEnhancePageHtml } from './ui.js';

interface EnhanceSession {
  id: string;
  original: string;
  enhanced: string;
  endpoint: string;
  model: string;
  createdAt: number;
}

interface SubmitBody {
  action: 'use-enhanced' | 'use-original' | 'use-edited' | 'cancel';
  text?: string;
}

interface ReEnhanceBody {
  prompt: string;
}

function json(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
}

function text(res: ServerResponse, status: number, body: string): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.end(body);
}

function isLocalhostOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function setCors(req: IncomingMessage, res: ServerResponse): void {
  const origin = req.headers.origin;
  if (!origin) return;
  if (!isLocalhostOrigin(origin)) return;

  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function readJsonBody<T>(req: IncomingMessage, maxBytes = 1024 * 1024): Promise<T> {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buf.length;
    if (total > maxBytes) {
      throw new Error(`Request body too large (max ${maxBytes} bytes)`);
    }
    chunks.push(buf);
  }

  const raw = Buffer.concat(chunks).toString('utf-8');
  if (!raw) {
    throw new Error('Empty request body');
  }
  return JSON.parse(raw) as T;
}

async function findAvailablePort(start = 3000, end = 3100): Promise<number> {
  for (let port = start; port <= end; port++) {
    const canListen = await new Promise<boolean>((resolve) => {
      const tester = net.createServer();

      tester.once('error', () => {
        resolve(false);
      });

      tester.once('listening', () => {
        tester.close(() => resolve(true));
      });

      tester.listen(port, '127.0.0.1');
    });

    if (canListen) {
      return port;
    }
  }
  throw new Error(`No available port in range ${start}-${end}`);
}

export interface EnhanceServerOptions {
  endpointOverride?: 'openai' | 'claude' | 'gemini';
  conversationHistory?: string;
  projectRootPath?: string;
  onStarted?: (url: string) => void;
}

export async function startEnhanceServer(
  prompt: string,
  options: EnhanceServerOptions = {},
): Promise<EnhanceResult> {
  const port = await findAvailablePort();

  const initial = await enhancePrompt({
    prompt,
    endpointOverride: options.endpointOverride,
    conversationHistory: options.conversationHistory,
    projectRootPath: options.projectRootPath,
  });

  const session: EnhanceSession = {
    id: randomUUID(),
    original: initial.original,
    enhanced: initial.enhanced,
    endpoint: initial.endpoint,
    model: initial.model,
    createdAt: Date.now(),
  };

  let resolved = false;
  let resolveResult: ((r: EnhanceResult) => void) | undefined;
  let rejectResult: ((e: Error) => void) | undefined;

  const resultPromise = new Promise<EnhanceResult>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  const timeoutMs = getEnhancerWebUiTimeoutMs();

  const server = http.createServer(async (req, res) => {
    try {
      setCors(req, res);

      if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return;
      }

      const url = new URL(req.url || '/', `http://localhost:${port}`);

      if (req.method === 'GET' && url.pathname === '/enhance') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(getEnhancePageHtml(timeoutMs));
        return;
      }

      if (req.method === 'GET' && url.pathname === '/api/session') {
        json(res, 200, {
          id: session.id,
          original: session.original,
          enhanced: session.enhanced,
          endpoint: session.endpoint,
          model: session.model,
          createdAt: session.createdAt,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/submit') {
        const body = await readJsonBody<SubmitBody>(req);

        if (body.action === 'cancel') {
          abort('User cancelled the prompt enhancer');
          json(res, 200, { ok: true });
          return;
        }

        if (body.action === 'use-original') {
          finish(session.original);
          json(res, 200, { ok: true });
          return;
        }

        if (body.action === 'use-enhanced') {
          finish(session.enhanced);
          json(res, 200, { ok: true });
          return;
        }

        if (body.action === 'use-edited') {
          const edited = (body.text || '').trim();
          if (!edited) {
            json(res, 400, { error: 'Edited text is required' });
            return;
          }
          finish(edited);
          json(res, 200, { ok: true });
          return;
        }

        json(res, 400, { error: 'Unknown action' });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/api/re-enhance') {
        const body = await readJsonBody<ReEnhanceBody>(req);
        const nextPrompt = (body.prompt || '').trim();
        if (!nextPrompt) {
          json(res, 400, { error: 'prompt is required' });
          return;
        }

        const next = await enhancePrompt({
          prompt: nextPrompt,
          endpointOverride: options.endpointOverride,
          conversationHistory: options.conversationHistory,
          projectRootPath: options.projectRootPath,
        });

        session.original = nextPrompt;
        session.enhanced = next.enhanced;
        session.endpoint = next.endpoint;
        session.model = next.model;

        json(res, 200, {
          enhanced: session.enhanced,
          endpoint: session.endpoint,
          model: session.model,
        });
        return;
      }

      text(res, 404, 'Not Found');
    } catch (err) {
      const error = err as { message?: string; stack?: string };
      logger.error({ error: error.message, stack: error.stack }, 'Enhancer server error');
      json(res, 500, { error: error.message || 'Internal error' });
    }
  });

  const timeout = setTimeout(() => {
    if (resolved) return;
    logger.info('会话超时，自动使用增强版结果');
    finish(session.enhanced);
  }, timeoutMs);

  function abort(message: string): void {
    if (resolved) return;
    resolved = true;
    clearTimeout(timeout);
    server.close(() => {
      rejectResult?.(new Error(message));
    });
  }

  function finish(selectedText: string): void {
    if (resolved) return;
    resolved = true;
    clearTimeout(timeout);

    const result: EnhanceResult = {
      original: session.original,
      enhanced: selectedText,
      endpoint: session.endpoint,
      model: session.model,
    };

    server.close(() => {
      resolveResult?.(result);
    });
  }

  const url = `http://localhost:${port}/enhance`;

  await new Promise<void>((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => {
      logger.info({ port }, 'Prompt enhancer server started');
      options.onStarted?.(url);
      resolve();
    });
  });

  return resultPromise;
}
