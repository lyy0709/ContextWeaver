import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  checkEnhancerEnv,
  getEnhancerConfig,
} from '../src/config.js';

describe('checkEnhancerEnv', () => {
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    savedEnv.PROMPT_ENHANCER_TOKEN = process.env.PROMPT_ENHANCER_TOKEN;
  });

  afterEach(() => {
    if (savedEnv.PROMPT_ENHANCER_TOKEN === undefined) {
      delete process.env.PROMPT_ENHANCER_TOKEN;
    } else {
      process.env.PROMPT_ENHANCER_TOKEN = savedEnv.PROMPT_ENHANCER_TOKEN;
    }
  });

  it('should report missing when PROMPT_ENHANCER_TOKEN is not set', () => {
    delete process.env.PROMPT_ENHANCER_TOKEN;
    const result = checkEnhancerEnv();
    expect(result.isValid).toBe(false);
    expect(result.missingVars).toContain('PROMPT_ENHANCER_TOKEN');
  });

  it('should report missing when PROMPT_ENHANCER_TOKEN is placeholder', () => {
    process.env.PROMPT_ENHANCER_TOKEN = 'your-api-key-here';
    const result = checkEnhancerEnv();
    expect(result.isValid).toBe(false);
    expect(result.missingVars).toContain('PROMPT_ENHANCER_TOKEN');
  });

  it('should report valid when PROMPT_ENHANCER_TOKEN is set', () => {
    process.env.PROMPT_ENHANCER_TOKEN = 'sk-real-api-key';
    const result = checkEnhancerEnv();
    expect(result.isValid).toBe(true);
    expect(result.missingVars).toHaveLength(0);
  });
});

describe('getEnhancerConfig', () => {
  const savedEnv: Record<string, string | undefined> = {};
  const envKeys = [
    'PROMPT_ENHANCER_TOKEN',
    'PROMPT_ENHANCER_ENDPOINT',
    'PROMPT_ENHANCER_BASE_URL',
    'PROMPT_ENHANCER_MODEL',
    'PROMPT_ENHANCER_TEMPLATE',
  ];

  beforeEach(() => {
    for (const key of envKeys) {
      savedEnv[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const key of envKeys) {
      if (savedEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = savedEnv[key];
      }
    }
  });

  it('should throw when PROMPT_ENHANCER_TOKEN is missing', () => {
    delete process.env.PROMPT_ENHANCER_TOKEN;
    expect(() => getEnhancerConfig()).toThrow('PROMPT_ENHANCER_TOKEN');
  });

  it('should return default openai config when only token is set', () => {
    process.env.PROMPT_ENHANCER_TOKEN = 'sk-test';
    delete process.env.PROMPT_ENHANCER_ENDPOINT;
    delete process.env.PROMPT_ENHANCER_BASE_URL;
    delete process.env.PROMPT_ENHANCER_MODEL;

    const config = getEnhancerConfig();
    expect(config.endpoint).toBe('openai');
    expect(config.apiKey).toBe('sk-test');
    expect(config.baseUrl).toContain('openai.com');
    expect(config.model).toBe('gpt-4o-mini');
  });

  it('should use claude defaults when endpoint is claude', () => {
    process.env.PROMPT_ENHANCER_TOKEN = 'sk-test';
    process.env.PROMPT_ENHANCER_ENDPOINT = 'claude';
    delete process.env.PROMPT_ENHANCER_BASE_URL;
    delete process.env.PROMPT_ENHANCER_MODEL;

    const config = getEnhancerConfig();
    expect(config.endpoint).toBe('claude');
    expect(config.baseUrl).toContain('anthropic.com');
    expect(config.model).toContain('claude');
  });

  it('should use gemini defaults when endpoint is gemini', () => {
    process.env.PROMPT_ENHANCER_TOKEN = 'sk-test';
    process.env.PROMPT_ENHANCER_ENDPOINT = 'gemini';
    delete process.env.PROMPT_ENHANCER_BASE_URL;
    delete process.env.PROMPT_ENHANCER_MODEL;

    const config = getEnhancerConfig();
    expect(config.endpoint).toBe('gemini');
    expect(config.baseUrl).toContain('googleapis.com');
    expect(config.model).toContain('gemini');
  });

  it('should allow custom base URL override', () => {
    process.env.PROMPT_ENHANCER_TOKEN = 'sk-test';
    process.env.PROMPT_ENHANCER_BASE_URL = 'https://my-proxy.com/v1/chat';

    const config = getEnhancerConfig();
    expect(config.baseUrl).toBe('https://my-proxy.com/v1/chat');
  });

  it('should allow custom model override', () => {
    process.env.PROMPT_ENHANCER_TOKEN = 'sk-test';
    process.env.PROMPT_ENHANCER_MODEL = 'custom-model-v2';

    const config = getEnhancerConfig();
    expect(config.model).toBe('custom-model-v2');
  });

  it('should throw on invalid endpoint', () => {
    process.env.PROMPT_ENHANCER_TOKEN = 'sk-test';
    process.env.PROMPT_ENHANCER_ENDPOINT = 'invalid';

    expect(() => getEnhancerConfig()).toThrow('PROMPT_ENHANCER_ENDPOINT');
  });

  it('should accept case-insensitive endpoint', () => {
    process.env.PROMPT_ENHANCER_TOKEN = 'sk-test';
    process.env.PROMPT_ENHANCER_ENDPOINT = 'OPENAI';

    const config = getEnhancerConfig();
    expect(config.endpoint).toBe('openai');
  });

  it('should pass template path from env', () => {
    process.env.PROMPT_ENHANCER_TOKEN = 'sk-test';
    process.env.PROMPT_ENHANCER_TEMPLATE = '/custom/template.txt';

    const config = getEnhancerConfig();
    expect(config.templatePath).toBe('/custom/template.txt');
  });
});
