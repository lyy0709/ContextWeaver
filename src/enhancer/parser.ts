/**
 * Strip outermost Markdown code fences (```...```) that some models wrap
 * around the XML output.
 */
function stripMarkdownCodeFences(text: string): string {
  const fenced = /^```(?:\w+)?\s*\r?\n([\s\S]*?)\r?\n```\s*$/;
  const match = text.match(fenced);
  return match ? match[1] : text;
}

/**
 * Remove leading preamble text that appears before the first XML tag.
 * Models sometimes prepend "Here is the enhanced prompt:" or similar.
 */
function stripLeadingPreamble(text: string): string {
  const tagStart = text.indexOf('<enhanced-prompt');
  const altTagStart = text.indexOf('<augment-enhanced-prompt');

  // Find the earliest tag position (ignoring -1 = not found)
  let earliest = -1;
  if (tagStart >= 0 && altTagStart >= 0) {
    earliest = Math.min(tagStart, altTagStart);
  } else if (tagStart >= 0) {
    earliest = tagStart;
  } else if (altTagStart >= 0) {
    earliest = altTagStart;
  }

  if (earliest > 0) {
    return text.slice(earliest);
  }
  return text;
}

/**
 * Parse the enhanced prompt from the LLM response.
 *
 * Extraction priority:
 *   1. `<enhanced-prompt>...</enhanced-prompt>`
 *   2. `<augment-enhanced-prompt ...>...</augment-enhanced-prompt>`
 *
 * When no tag is found, returns `fallbackPrompt` (the original user prompt)
 * to avoid exposing raw LLM output to downstream consumers.
 */
export function parseEnhancedPrompt(response: string, fallbackPrompt?: string): string {
  const normalized = stripMarkdownCodeFences(stripLeadingPreamble(response.trim())).trim();

  const patterns: RegExp[] = [
    /<enhanced-prompt>([\s\S]*?)<\/enhanced-prompt>/,
    /<augment-enhanced-prompt(?:\s+[^>]*)?>\s*([\s\S]*?)\s*<\/augment-enhanced-prompt\s*>/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const extracted = match?.[1]?.trim();
    if (extracted) {
      return extracted;
    }
  }

  // Fallback: return original prompt instead of raw LLM output
  if (fallbackPrompt !== undefined) {
    return fallbackPrompt.trim();
  }

  // Legacy: no fallback provided, return trimmed response (backward compat)
  return response.trim();
}
