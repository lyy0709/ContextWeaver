import { describe, it, expect } from 'vitest';
import { detectLanguage } from '../../src/enhancer/detect.js';

describe('detectLanguage', () => {
  it('should detect Chinese when >= 3 Chinese characters present', () => {
    expect(detectLanguage('我需要登录功能')).toBe('zh');
    expect(detectLanguage('新增用户认证模块')).toBe('zh');
  });

  it('should detect Chinese with exactly 3 characters', () => {
    expect(detectLanguage('abc你好吗def')).toBe('zh');
  });

  it('should detect English when < 3 Chinese characters', () => {
    expect(detectLanguage('Add login feature')).toBe('en');
    expect(detectLanguage('Fix the bug in checkout')).toBe('en');
  });

  it('should detect English with only 2 Chinese characters', () => {
    expect(detectLanguage('hello 你好 world')).toBe('en');
  });

  it('should detect English with 0 Chinese characters', () => {
    expect(detectLanguage('pure english text')).toBe('en');
  });

  it('should detect English for empty string', () => {
    expect(detectLanguage('')).toBe('en');
  });

  it('should detect Chinese for mixed content with >= 3 Chinese chars', () => {
    expect(detectLanguage('Please add 用户认证 feature and 登录 page')).toBe('zh');
  });

  it('should handle special Unicode characters without false positive', () => {
    // Japanese katakana / hiragana should not count as Chinese
    expect(detectLanguage('これはテストです')).toBe('en');
  });

  it('should detect Chinese for CJK Unified Ideographs range', () => {
    // U+4E00 to U+9FFF
    expect(detectLanguage('\u4e00\u4e01\u4e02')).toBe('zh');
  });
});
