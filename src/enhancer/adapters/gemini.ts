import { fetchWithRetry } from '../fetchWithRetry.js';
import type { LlmClient, LlmClientConfig, LlmMessage } from '../llmClient.js';

interface GeminiContentPart {
  text: string;
}

interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiContentPart[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { message?: string };
}

export class GeminiAdapter implements LlmClient {
  private config: LlmClientConfig;

  constructor(config: LlmClientConfig) {
    this.config = config;
  }

  async chat(messages: LlmMessage[]): Promise<string> {
    const systemInstruction = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n');

    const contents: GeminiContent[] = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const baseUrl = this.config.baseUrl.replace(/\/+$/, '');
    const withoutVersion = baseUrl.replace(/\/v1beta$/, '');
    const url = `${withoutVersion}/v1beta/models/${encodeURIComponent(this.config.model)}:generateContent?key=${encodeURIComponent(this.config.apiKey)}`;

    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: systemInstruction
          ? { parts: [{ text: systemInstruction }] }
          : undefined,
        contents,
        generationConfig: {
          temperature: 0.3,
          stopSequences: ['<cw-end/>'],
        },
      }),
    });

    const raw = await response.text();
    let data: GeminiResponse;
    try {
      data = JSON.parse(raw) as GeminiResponse;
    } catch {
      throw new Error(`Gemini API 错误: HTTP ${response.status} - ${raw.slice(0, 200)}`);
    }

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || `HTTP ${response.status}`;
      throw new Error(`Gemini API 错误: ${errorMsg}`);
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error('Gemini API 返回为空');
    }

    return content;
  }
}
