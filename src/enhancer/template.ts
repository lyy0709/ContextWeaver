import { promises as fs } from 'node:fs';
import { logger } from '../utils/logger.js';

export const DEFAULT_TEMPLATE = `你是一个提示词优化专家。

你的任务：将用户的原始提示词进行增强，使其更清晰、更具体、更可执行。

增强要求：
- 保留原始意图，不要改变需求方向
- 补全缺失的上下文、约束、验收标准与边界条件
- 给出结构化、可直接执行的指令（适当使用列表/步骤）
- 如果原始提示词包含三引号代码块，请尽量保持代码块内容不变

{{language_instruction}}

对话历史（如为空可忽略）：
{{conversation_history}}

请只输出增强后的提示词，并用以下 XML 标签包裹：
<enhanced-prompt>...</enhanced-prompt>

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

export function renderPrompt(template: string, vars: TemplateVars): string {
  const mapping: Record<string, string> = {
    original_prompt: vars.originalPrompt,
    conversation_history: vars.conversationHistory ?? '',
    language_instruction: vars.languageInstruction,
  };

  // Use single-pass replacement to avoid corrupting user content that
  // accidentally contains placeholder strings.
  return template.replace(
    /\{\{\s*(original_prompt|conversation_history|language_instruction)\s*\}\}/g,
    (match, key: string) => mapping[key] ?? match,
  );
}
