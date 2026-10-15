/**
 * Crest letters for a project sticker: an acronym first word stays whole
 * ("UAV Swarm" → "UAV"), several words give initials ("Mister Manager" →
 * "MM"), a single word gives its first two letters ("Skoll" → "SK").
 */
export function crest(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  if (/^[A-Z0-9]{2,4}$/.test(words[0])) return words[0];
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}
