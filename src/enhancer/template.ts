import { promises as fs } from 'node:fs';
import { logger } from '../utils/logger.js';

export const DEFAULT_TEMPLATE = `你是一个提示词优化专家。

你的任务：将用户的原始提示词进行增强，使其更清晰、更具体、更可执行。

增强要求：
- 保留原始意图，不要改变需求方向
- 补全缺失的上下文、约束、验收标准与边界条件
- 给出结构化、可直接执行的指令（适当使用列表/步骤）
- 如果原始提示词包含三引号代码块，请尽量保持代码块内容不变
- 如果提供了代码库上下文，请结合代码结构和实现细节来增强提示词，使其更贴合项目实际

{{language_instruction}}
{{conversation_history_block}}{{codebase_context_block}}
请只输出增强后的提示词，并用以下 XML 标签包裹：
<enhanced-prompt>...</enhanced-prompt>
然后在闭合标签后另起一行输出 <cw-end/>

原始提示词：
{{original_prompt}}
`;

// Allow overriding the template from environment variable.
// If PROMPT_ENHANCER_TEMPLATE contains a newline or '{{', treat it as inline template.
export function getTemplatePathOrInline(templateValue: string | undefined):
  | { kind: 'path'; value: string }
  | { kind: 'inline'; value: string }
  | undefined {
  if (!templateValue) return undefined;

  const trimmed = templateValue.trim();
  if (!trimmed) return undefined;

  if (trimmed.includes('\n') || trimmed.includes('{{')) {
    return { kind: 'inline', value: templateValue };
  }

  return { kind: 'path', value: trimmed };
}

export interface TemplateVars {
  originalPrompt: string;
  conversationHistory?: string;
  codebaseContext?: string;
  languageInstruction: string;
}

export async function loadTemplate(templatePath?: string): Promise<string> {
  const templateValue = templatePath;
  const resolved = getTemplatePathOrInline(templateValue);
  if (!resolved) return DEFAULT_TEMPLATE;

  if (resolved.kind === 'inline') {
    return resolved.value;
  }

  try {
    return await fs.readFile(resolved.value, 'utf-8');
  } catch (err) {
    const error = err as { message?: string };
    logger.warn(
      { templatePath: resolved.value, error: error.message },
      '读取自定义模板失败，已回退到默认模板',
    );
    return DEFAULT_TEMPLATE;
  }
}

/**
 * Build conditional block content. When the value is empty/undefined,
 * returns empty string so the entire section (title + content) is omitted,
 * saving tokens.
 */
function buildBlock(title: string, value: string | undefined): string {
  if (!value?.trim()) return '';
  return `\n${title}\n${value}\n`;
}

export function renderPrompt(template: string, vars: TemplateVars): string {
  // Build conditional blocks — entire section omitted when value is empty
  const conversationBlock = buildBlock(
    '对话历史：',
    vars.conversationHistory,
  );
  const codebaseBlock = buildBlock(
    '代码库上下文：',
    vars.codebaseContext,
  );

  const mapping: Record<string, string> = {
    original_prompt: vars.originalPrompt,
    // Legacy placeholders (backward compat for custom templates)
    conversation_history: vars.conversationHistory ?? '',
    codebase_context: vars.codebaseContext ?? '',
    // Block placeholders (conditional: entire section omitted when empty)
    conversation_history_block: conversationBlock,
    codebase_context_block: codebaseBlock,
    language_instruction: vars.languageInstruction,
  };

  // Use single-pass replacement to avoid corrupting user content that
  // accidentally contains placeholder strings.
  return template.replace(
    /\{\{\s*(original_prompt|conversation_history_block|codebase_context_block|conversation_history|codebase_context|language_instruction)\s*\}\}/g,
    (match, key: string) => mapping[key] ?? match,
  );
}
