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

  describe('fallback behavior', () => {
    it('should return trimmed full response when no tag found', () => {
      const response = '  This is a plain response without XML tags  ';
      expect(parseEnhancedPrompt(response)).toBe(
        'This is a plain response without XML tags',
      );
    });

    it('should return trimmed response for empty tags', () => {
      const response = '<enhanced-prompt></enhanced-prompt> Some other text';
      // Empty tag match -> extracted is empty string after trim -> falsy, moves to next pattern
      // augment pattern also doesn't match -> fallback to full trim
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
  });
});
