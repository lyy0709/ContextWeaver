import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { enhancePromptSchema } from '../../src/mcp/tools/enhancePrompt.js';

describe('enhancePromptSchema', () => {
  it('should accept valid input with only prompt', () => {
    const result = enhancePromptSchema.parse({ prompt: 'Add login feature' });
    expect(result.prompt).toBe('Add login feature');
    expect(result.conversation_history).toBeUndefined();
    expect(result.project_root_path).toBeUndefined();
  });

  it('should accept valid input with all fields', () => {
    const result = enhancePromptSchema.parse({
      prompt: 'Add login feature',
      conversation_history: 'User: hi\nAssistant: hello',
      project_root_path: '/home/user/project',
    });
    expect(result.prompt).toBe('Add login feature');
    expect(result.conversation_history).toBe('User: hi\nAssistant: hello');
    expect(result.project_root_path).toBe('/home/user/project');
  });

  it('should reject input without prompt', () => {
    expect(() => enhancePromptSchema.parse({})).toThrow();
  });

  it('should reject input with non-string prompt', () => {
    expect(() => enhancePromptSchema.parse({ prompt: 123 })).toThrow();
  });
});
