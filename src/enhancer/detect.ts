export function detectLanguage(text: string): 'zh' | 'en' {
  const matches = text.match(/[\u4e00-\u9fff]/g);
  const count = matches?.length ?? 0;
  return count >= 3 ? 'zh' : 'en';
}

