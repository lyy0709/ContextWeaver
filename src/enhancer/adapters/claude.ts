import type { LlmClient, LlmClientConfig, LlmMessage } from '../llmClient.js';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: Array<{ type: 'text'; text: string }>;
}

interface ClaudeResponse {
  content?: Array<{ type?: string; text?: string }>;
  error?: { message?: string };
}

export class ClaudeAdapter implements LlmClient {
  private config: LlmClientConfig;

  constructor(config: LlmClientConfig) {
    this.config = config;
  }

  async chat(messages: LlmMessage[]): Promise<string> {
    const system = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n');

    const userAssistantMessages: ClaudeMessage[] = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: [{ type: 'text', text: m.content }],
      }));

    const response = await fetch(this.config.baseUrl, {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        system,
        messages: userAssistantMessages,
        max_tokens: 4096,
        temperature: 0.7,
      }),
    });

    const data = (await response.json()) as ClaudeResponse;

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || `HTTP ${response.status}`;
      throw new Error(`Claude API 错误: ${errorMsg}`);
    }

    const content = data.content?.[0]?.text;
    if (!content) {
      throw new Error('Claude API 返回为空');
    }

    return content;
  }
}

