import { describe, it, expect } from 'vitest';
import { extractTechnicalTerms } from '../../src/enhancer/index.js';

describe('extractTechnicalTerms', () => {
  it('should extract backtick-wrapped identifiers', () => {
    const terms = extractTechnicalTerms('Check `SearchService` and `ContextPacker`.');
    expect(terms).toContain('SearchService');
    expect(terms).toContain('ContextPacker');
  });

  it('should extract backtick-wrapped file paths', () => {
    const terms = extractTechnicalTerms('Edit `src/enhancer/index.ts` for changes.');
    expect(terms).toContain('src/enhancer/index.ts');
  });

  it('should extract file paths with extensions', () => {
    const terms = extractTechnicalTerms('Modify README.md and package.json');
    expect(terms).toContain('README.md');
    expect(terms).toContain('package.json');
  });

  it('should extract PascalCase identifiers', () => {
    const terms = extractTechnicalTerms('The SearchService class uses GraphExpander.');
    expect(terms).toContain('SearchService');
    expect(terms).toContain('GraphExpander');
  });

  it('should extract camelCase identifiers', () => {
    const terms = extractTechnicalTerms('Call handleCodebaseRetrieval for context.');
    expect(terms).toContain('handleCodebaseRetrieval');
  });

  it('should extract snake_case identifiers', () => {
    const terms = extractTechnicalTerms('Set conversation_history and technical_terms.');
    expect(terms).toContain('conversation_history');
    expect(terms).toContain('technical_terms');
  });

  it('should deduplicate terms', () => {
    const terms = extractTechnicalTerms('`SearchService` works with SearchService.');
    const count = terms.filter((t) => t === 'SearchService').length;
    expect(count).toBe(1);
  });

  it('should limit to MAX_TERMS (20)', () => {
    // Generate 25 unique backtick terms
    const items = Array.from({ length: 25 }, (_, i) => `\`Term${String(i).padStart(3, '0')}Value\``);
    const terms = extractTechnicalTerms(items.join(' '));
    expect(terms.length).toBeLessThanOrEqual(20);
  });

  it('should skip very short identifiers (< 3 chars)', () => {
    const terms = extractTechnicalTerms('`ab` is too short, `abc` is ok.');
    expect(terms).not.toContain('ab');
    expect(terms).toContain('abc');
  });

  it('should return empty array for plain text without identifiers', () => {
    const terms = extractTechnicalTerms('Please add a login page.');
    expect(terms).toEqual([]);
  });

  it('should handle mixed content', () => {
    const prompt = `
      Fix the \`SearchService\` in src/search/SearchService.ts.
      The handleCodebaseRetrieval function should use technical_terms.
      Also check ContextPacker and GraphExpander.
    `;
    const terms = extractTechnicalTerms(prompt);
    expect(terms).toContain('SearchService');
    expect(terms).toContain('src/search/SearchService.ts');
    expect(terms).toContain('handleCodebaseRetrieval');
    expect(terms).toContain('technical_terms');
    expect(terms).toContain('ContextPacker');
    expect(terms).toContain('GraphExpander');
  });
});
