import { checkEnhancerEnv, getEnhancerConfig } from '../config.js';
import { detectLanguage } from './detect.js';
import { createLlmClient } from './llmClient.js';
import { parseEnhancedPrompt } from './parser.js';
import { loadTemplate, renderPrompt } from './template.js';

export interface EnhanceOptions {
  prompt: string;
  conversationHistory?: string;
  projectRootPath?: string;
  endpointOverride?: 'openai' | 'claude' | 'gemini';
}

export interface EnhanceResult {
  original: string;
  enhanced: string;
  endpoint: string;
  model: string;
}

export async function enhancePrompt(options: EnhanceOptions): Promise<EnhanceResult> {
  const envCheck = checkEnhancerEnv();
  if (!envCheck.isValid) {
    throw new Error(
      `Prompt Enhancer 环境变量未配置: ${envCheck.missingVars.join(', ')}`,
    );
  }

  const config = getEnhancerConfig();
  const endpoint = options.endpointOverride ?? config.endpoint;

  const defaultBaseUrlByEndpoint: Record<'openai' | 'claude' | 'gemini', string> = {
    openai: 'https://api.openai.com/v1/chat/completions',
    claude: 'https://api.anthropic.com/v1/messages',
    gemini: 'https://generativelanguage.googleapis.com/v1beta',
  };

  const defaultModelByEndpoint: Record<'openai' | 'claude' | 'gemini', string> = {
    openai: 'gpt-4o-mini',
    claude: 'claude-sonnet-4-20250514',
    gemini: 'gemini-2.0-flash',
  };

  // If endpoint is overridden, baseUrl/model should follow that endpoint's defaults,
  // unless user explicitly configured PROMPT_ENHANCER_BASE_URL / PROMPT_ENHANCER_MODEL.
  const baseUrl = process.env.PROMPT_ENHANCER_BASE_URL || defaultBaseUrlByEndpoint[endpoint];
  const model = process.env.PROMPT_ENHANCER_MODEL || defaultModelByEndpoint[endpoint];

  const configWithOverride = {
    ...config,
    endpoint,
    baseUrl,
    model,
  };

  const language = detectLanguage(options.prompt);
  const languageInstruction =
    language === 'zh'
      ? '请用中文输出增强后的提示词。'
      : 'Please output the enhanced prompt in English.';

  const template = await loadTemplate(configWithOverride.templatePath);
  const rendered = renderPrompt(template, {
    originalPrompt: options.prompt,
    conversationHistory: options.conversationHistory,
    languageInstruction,
  });

  const client = await createLlmClient(configWithOverride);

  const raw = await client.chat([
    {
      role: 'system',
      content: 'You are a helpful prompt enhancement assistant.',
    },
    {
      role: 'user',
      content: rendered,
    },
  ]);

  const enhanced = parseEnhancedPrompt(raw);
  return {
    original: options.prompt,
    enhanced,
    endpoint: configWithOverride.endpoint,
    model: configWithOverride.model || '',
  };
}
