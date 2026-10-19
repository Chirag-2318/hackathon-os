/**
 * Glues the last two words together with a non-breaking space so a paragraph never ends on a single word.
 * Does not apply to strings that contain '<' or have fewer than three words.
 */
export function noOrphan(text: string): string {
  if (!text || text.includes('<')) return text;
  const firstSpace = text.indexOf(' ');
  if (firstSpace <= 0) return text;
  const lastSpace = text.lastIndexOf(' ');
  if (lastSpace === firstSpace) return text;
  return text.slice(0, lastSpace) + '\u00A0' + text.slice(lastSpace + 1);
}
