import type { LlmClient, LlmClientConfig, LlmMessage } from '../llmClient.js';

interface OpenAiChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

export class OpenAiAdapter implements LlmClient {
  private config: LlmClientConfig;

  constructor(config: LlmClientConfig) {
    this.config = config;
  }

  async chat(messages: LlmMessage[]): Promise<string> {
    const response = await fetch(this.config.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: 0.7,
      }),
    });

    const data = (await response.json()) as OpenAiChatCompletionResponse;

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || `HTTP ${response.status}`;
      throw new Error(`OpenAI API 错误: ${errorMsg}`);
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI API 返回为空');
    }

    return content;
  }
}

