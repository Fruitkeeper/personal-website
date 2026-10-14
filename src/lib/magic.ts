// Pure logic for the Magic planet (scripts/magic.ts): which cards a booster
// asks Scryfall for, and parsing Scryfall's card objects.

export type Card = {
  name: string;
  /** Front-face image (Scryfall "normal" size). */
  image: string;
  /** Scryfall page for the card. */
  href: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'mythic' | 'special';
  set: string;
  /** Rares and mythics get the foil shimmer. */
  foil: boolean;
};

const RARITIES = new Set(['common', 'uncommon', 'rare', 'mythic', 'special']);
const HTTPS = /^https:\/\//;

/**
 * Parse a Scryfall card. Double-faced cards keep their images on each face,
 * so fall back to the front face. Null if there's no usable image.
 */
export function parseCard(json: unknown): Card | null {
  if (!json || typeof json !== 'object') return null;
  const c = json as Record<string, any>;
  if (c.object !== 'card' || typeof c.name !== 'string') return null;
  const image: unknown = c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal;
  const href: unknown = c.scryfall_uri;
  if (typeof image !== 'string' || !HTTPS.test(image) || typeof href !== 'string' || !HTTPS.test(href)) return null;
  const rarity = RARITIES.has(c.rarity) ? c.rarity : 'common';
  return {
    name: c.name,
    image,
    href,
    rarity,
    set: typeof c.set_name === 'string' ? c.set_name : '',
    foil: rarity === 'rare' || rarity === 'mythic',
  };
}

/** Only paper-legal-looking, real cards: no tokens, art cards or funny sets. */
const BASE_FILTER = 'game:paper -is:funny -t:token -t:emblem';

/**
 * Scryfall searches for one booster, in reveal order: commons, uncommons,
 * then the rare slot (mythic ~1 in 8, like real packs). `roll` is in [0, 1).
 */
export function boosterQueries(roll: number): string[] {
  const rareSlot = roll < 1 / 8 ? 'r:mythic' : 'r:rare';
  return [
    `r:common ${BASE_FILTER}`,
    `r:common ${BASE_FILTER}`,
    `r:common ${BASE_FILTER}`,
    `r:uncommon ${BASE_FILTER}`,
    `${rareSlot} ${BASE_FILTER}`,
  ];
}

/** Scryfall asks for 50–100ms between requests; keep a safe gap. */
export const REQUEST_GAP_MS = 110;
