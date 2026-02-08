import { describe, it, expect } from 'vitest';
import { getEnhancePageHtml } from '../../src/enhancer/ui.js';

describe('getEnhancePageHtml', () => {
  it('should return valid HTML string', () => {
    const html = getEnhancePageHtml();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('</html>');
  });

  it('should contain page title', () => {
    const html = getEnhancePageHtml();
    expect(html).toContain('ContextWeaver Prompt Enhancer');
  });

  it('should contain textarea elements for original and enhanced', () => {
    const html = getEnhancePageHtml();
    expect(html).toContain('id="original"');
    expect(html).toContain('id="enhanced"');
  });

  it('should contain action buttons', () => {
    const html = getEnhancePageHtml();
    expect(html).toContain('useOriginalBtn');
    expect(html).toContain('useEnhancedBtn');
    expect(html).toContain('useEditedBtn');
    expect(html).toContain('reEnhanceBtn');
    expect(html).toContain('cancelBtn');
  });

  it('should contain API fetch calls', () => {
    const html = getEnhancePageHtml();
    expect(html).toContain('/api/session');
    expect(html).toContain('/api/submit');
    expect(html).toContain('/api/re-enhance');
  });

  it('should have dark theme CSS variables', () => {
    const html = getEnhancePageHtml();
    expect(html).toContain('--bg:');
    expect(html).toContain('--panel:');
    expect(html).toContain('--primary:');
  });

  it('should have accessibility labels', () => {
    const html = getEnhancePageHtml();
    expect(html).toContain('aria-label="Original prompt"');
    expect(html).toContain('aria-label="Enhanced prompt"');
  });
});
