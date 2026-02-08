import { describe, it, expect } from 'vitest';
import { parseEnhancedPrompt } from '../../src/enhancer/parser.js';

describe('parseEnhancedPrompt', () => {
  describe('enhanced-prompt tag extraction', () => {
    it('should extract content from <enhanced-prompt> tag', () => {
      const response = `Here is the enhanced version:
<enhanced-prompt>Please implement a login page with OAuth2 support.</enhanced-prompt>`;
      expect(parseEnhancedPrompt(response)).toBe(
        'Please implement a login page with OAuth2 support.',
      );
    });

    it('should handle multiline content inside tag', () => {
      const response = `<enhanced-prompt>
Step 1: Create the UI
Step 2: Add validation
Step 3: Connect API
</enhanced-prompt>`;
      expect(parseEnhancedPrompt(response)).toBe(
        'Step 1: Create the UI\nStep 2: Add validation\nStep 3: Connect API',
      );
    });

    it('should trim whitespace around extracted content', () => {
      const response = '<enhanced-prompt>  trimmed content  </enhanced-prompt>';
      expect(parseEnhancedPrompt(response)).toBe('trimmed content');
    });
  });

  describe('augment-enhanced-prompt tag extraction', () => {
    it('should extract content from <augment-enhanced-prompt> tag', () => {
      const response =
        '<augment-enhanced-prompt>Enhanced prompt here</augment-enhanced-prompt>';
      expect(parseEnhancedPrompt(response)).toBe('Enhanced prompt here');
    });

    it('should handle attributes on the tag', () => {
      const response =
        '<augment-enhanced-prompt lang="en"> Enhanced with attrs </augment-enhanced-prompt>';
      expect(parseEnhancedPrompt(response)).toBe('Enhanced with attrs');
    });
  });

  describe('markdown code fence stripping', () => {
    it('should strip ```xml fenced output', () => {
      const response = '```xml\n<enhanced-prompt>Fenced content</enhanced-prompt>\n```';
      expect(parseEnhancedPrompt(response)).toBe('Fenced content');
    });

    it('should strip bare ``` fenced output', () => {
      const response = '```\n<enhanced-prompt>Bare fenced</enhanced-prompt>\n```';
      expect(parseEnhancedPrompt(response)).toBe('Bare fenced');
    });

    it('should handle preamble + fenced output', () => {
      const response =
        'Here is the result:\n<enhanced-prompt>With preamble</enhanced-prompt>';
      expect(parseEnhancedPrompt(response)).toBe('With preamble');
    });
  });

  describe('leading preamble stripping', () => {
    it('should strip "Here is..." preamble before tag', () => {
      const response =
        'Here is the enhanced prompt:\n<enhanced-prompt>Clean output</enhanced-prompt>';
      expect(parseEnhancedPrompt(response)).toBe('Clean output');
    });

    it('should strip Chinese preamble before tag', () => {
      const response =
        '增强后的提示词如下：\n<enhanced-prompt>Clean Chinese output</enhanced-prompt>';
      expect(parseEnhancedPrompt(response)).toBe('Clean Chinese output');
    });
  });

  describe('fallback behavior with fallbackPrompt', () => {
    it('should return fallbackPrompt when no tag found', () => {
      const response = 'This is a plain response without XML tags';
      expect(parseEnhancedPrompt(response, 'original prompt')).toBe('original prompt');
    });

    it('should return fallbackPrompt for empty tags', () => {
      const response = '<enhanced-prompt></enhanced-prompt> Some other text';
      expect(parseEnhancedPrompt(response, 'original prompt')).toBe('original prompt');
    });

    it('should trim fallbackPrompt', () => {
      const response = 'no tags here';
      expect(parseEnhancedPrompt(response, '  my original  ')).toBe('my original');
    });
  });

  describe('legacy fallback (no fallbackPrompt)', () => {
    it('should return trimmed full response when no tag found and no fallback', () => {
      const response = '  This is a plain response without XML tags  ';
      expect(parseEnhancedPrompt(response)).toBe(
        'This is a plain response without XML tags',
      );
    });

    it('should return trimmed response for empty tags', () => {
      const response = '<enhanced-prompt></enhanced-prompt> Some other text';
      expect(parseEnhancedPrompt(response)).toBe(
        '<enhanced-prompt></enhanced-prompt> Some other text',
      );
    });
  });

  describe('priority', () => {
    it('should prefer <enhanced-prompt> over <augment-enhanced-prompt>', () => {
      const response = `<enhanced-prompt>First</enhanced-prompt>
<augment-enhanced-prompt>Second</augment-enhanced-prompt>`;
      expect(parseEnhancedPrompt(response)).toBe('First');
    });
  });

  describe('edge cases', () => {
    it('should handle response with only whitespace', () => {
      expect(parseEnhancedPrompt('   ')).toBe('');
    });

    it('should handle empty string', () => {
      expect(parseEnhancedPrompt('')).toBe('');
    });

    it('should handle Chinese content in tags', () => {
      const response =
        '<enhanced-prompt>请实现一个用户登录页面，支持 OAuth2 认证。</enhanced-prompt>';
      expect(parseEnhancedPrompt(response)).toBe(
        '请实现一个用户登录页面，支持 OAuth2 认证。',
      );
    });

    it('should handle whitespace-only fallback when no tag', () => {
      expect(parseEnhancedPrompt('no tags', '   ')).toBe('');
    });
  });
});
