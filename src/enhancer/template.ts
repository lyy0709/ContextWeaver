import { promises as fs } from 'node:fs';
import { logger } from '../utils/logger.js';

export const DEFAULT_TEMPLATE_EN = `Your task is to rewrite my draft prompt into a clearer, more specific, and more actionable final prompt that I can use directly with an LLM.

Hard requirements:
- Write entirely from my perspective using first-person voice ("I").
- Preserve the original intent, goals, and constraints. Do not change the task itself.
- Remove ambiguity, fix logic and wording issues, and convert vague or negative constraints into explicit positive requirements whenever possible.
- If memory and context are provided, use them to improve accuracy and consistency with my preferences. Never invent, complete, or assume missing memory entries.
- If the draft includes code in triple backticks, keep the code blocks unchanged.
- Keep product names, API names, technical terms, code, and file paths in English when appropriate.
- Do not mention where information came from, and do not refer to any conversation source.
- Output only the optimized prompt text. No explanations, no headers, no extra notes.

{{conversation_history_block}}{{codebase_context_block}}
Output ONLY the rewritten prompt wrapped in the following XML tag:
<enhanced-prompt>...</enhanced-prompt>
Then output <cw-end/> on a new line after the closing tag.

Draft prompt:
{{original_prompt}}
`;

export const DEFAULT_TEMPLATE_ZH = `你的任务：将我的草稿提示词改写为更清晰、更精准、更可执行的最终版本，使其可以直接用于 LLM。

硬性要求：
- 以我的第一人称视角（"我"）书写。
- 保留原始意图、目标和约束，不改变任务本身。
- 消除歧义，修正逻辑和措辞问题，尽可能将模糊或否定式约束转换为明确的正面要求。
- 如果提供了对话历史或代码库上下文，利用其中的信息来提高准确性和一致性。不要凭空编造、补全或假设缺失的信息。
- 如果草稿中包含三引号代码块，保持代码块内容不变。
- 产品名、API 名、技术术语、代码和文件路径保持英文。
- 不要提及信息来源，不要引用任何对话来源。
- 只输出优化后的提示词文本，不要输出解释、标题或额外注释。

{{conversation_history_block}}{{codebase_context_block}}
请只输出改写后的提示词，并用以下 XML 标签包裹：
<enhanced-prompt>...</enhanced-prompt>
然后在闭合标签后另起一行输出 <cw-end/>

草稿提示词：
{{original_prompt}}
`;

export const DEFAULT_TEMPLATE = DEFAULT_TEMPLATE_ZH;

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
  /** Only used by custom templates that include {{language_instruction}} */
  languageInstruction?: string;
  language?: 'zh' | 'en';
}

export async function loadTemplate(templatePath?: string, language?: 'zh' | 'en'): Promise<string> {
  const templateValue = templatePath;
  const resolved = getTemplatePathOrInline(templateValue);
  if (!resolved) {
    // No custom template — pick by language
    return language === 'en' ? DEFAULT_TEMPLATE_EN : DEFAULT_TEMPLATE_ZH;
  }

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
    return language === 'en' ? DEFAULT_TEMPLATE_EN : DEFAULT_TEMPLATE_ZH;
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
  const isEn = vars.language === 'en';

  // Build conditional blocks — entire section omitted when value is empty
  const conversationBlock = buildBlock(
    isEn ? 'Conversation history:' : '对话历史：',
    vars.conversationHistory,
  );
  const codebaseBlock = buildBlock(
    isEn ? 'Codebase context:' : '代码库上下文：',
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
    language_instruction: vars.languageInstruction ?? '',
  };

  // Use single-pass replacement to avoid corrupting user content that
  // accidentally contains placeholder strings.
  return template.replace(
    /\{\{\s*(original_prompt|conversation_history_block|codebase_context_block|conversation_history|codebase_context|language_instruction)\s*\}\}/g,
    (match, key: string) => mapping[key] ?? match,
  );
}
