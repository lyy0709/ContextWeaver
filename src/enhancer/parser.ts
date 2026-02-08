export function parseEnhancedPrompt(response: string): string {
  const patterns: RegExp[] = [
    /<enhanced-prompt>([\s\S]*?)<\/enhanced-prompt>/,
    /<augment-enhanced-prompt(?:\s+[^>]*)?>\s*([\s\S]*?)\s*<\/augment-enhanced-prompt\s*>/,
  ];

  for (const pattern of patterns) {
    const match = response.match(pattern);
    const extracted = match?.[1]?.trim();
    if (extracted) {
      return extracted;
    }
  }

  return response.trim();
}
