/**
 * enhance-prompt MCP Tool
 */

import { z } from 'zod';
import { logger } from '../../utils/logger.js';

export const enhancePromptSchema = z.object({
  prompt: z.string().describe('The original prompt to enhance'),
  conversation_history: z
    .string()
    .optional()
    .describe(
      "Recent conversation history for context. Format: 'User: ...\\nAssistant: ...'",
    ),
  project_root_path: z.string().optional().describe('Project root path for context'),
});

export type EnhancePromptInput = z.infer<typeof enhancePromptSchema>;

function formatEnvMissingResponse(missingVars: string[]): {
  content: Array<{ type: 'text'; text: string }>;
} {
  const configPath = '~/.contextweaver/.env';

  const text = `## ⚠️ 配置缺失

ContextWeaver 的 Prompt Enhancer 需要配置外部 LLM API。

### 缺失的环境变量
${missingVars.map((v) => `- \`${v}\``).join('\n')}

### 配置步骤

请编辑配置文件：\`${configPath}\`，添加或取消注释以下配置：

\`\`\`bash
# Prompt Enhancer 配置（使用 enhance-prompt 工具时需要）
# PROMPT_ENHANCER_ENDPOINT=openai
# PROMPT_ENHANCER_BASE_URL=
PROMPT_ENHANCER_TOKEN=your-api-key-here
# PROMPT_ENHANCER_MODEL=
# PROMPT_ENHANCER_TEMPLATE=
\`\`\`

保存文件后重新调用此工具即可。
`;

  return {
    content: [
      {
        type: 'text',
        text,
      },
    ],
  };
}

export async function handleEnhancePrompt(
  args: EnhancePromptInput,
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  logger.info({ hasHistory: Boolean(args.conversation_history) }, 'MCP enhance-prompt 调用开始');

  const { checkEnhancerEnv } = await import('../../config.js');
  const envCheck = checkEnhancerEnv();
  if (!envCheck.isValid) {
    logger.warn({ missingVars: envCheck.missingVars }, 'Prompt Enhancer 环境变量未配置');
    return formatEnvMissingResponse(envCheck.missingVars);
  }

  try {
    const { enhancePrompt } = await import('../../enhancer/index.js');
    const result = await enhancePrompt({
      prompt: args.prompt,
      conversationHistory: args.conversation_history,
      projectRootPath: args.project_root_path,
    });

    return {
      content: [
        {
          type: 'text',
          text: result.enhanced,
        },
      ],
    };
  } catch (err) {
    const error = err as { message?: string; stack?: string };
    logger.error({ error: error.message, stack: error.stack }, 'MCP enhance-prompt 调用失败');
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message || 'unknown error'}`,
        },
      ],
      isError: true,
    };
  }
}

