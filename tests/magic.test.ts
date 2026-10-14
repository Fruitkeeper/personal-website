import { describe, expect, it } from 'vitest';
import { boosterQueries, parseCard } from '../src/lib/magic';

const card = (over: Record<string, unknown> = {}) => ({
  object: 'card',
  name: 'End the Festivities',
  rarity: 'common',
  set_name: 'Innistrad: Crimson Vow',
  scryfall_uri: 'https://scryfall.com/card/vow/155/end-the-festivities',
  image_uris: { normal: 'https://cards.scryfall.io/normal/front/b/e/x.jpg' },
  ...over,
});

describe('parseCard', () => {
  it('parses a normal card', () => {
    expect(parseCard(card())).toEqual({
      name: 'End the Festivities',
      image: 'https://cards.scryfall.io/normal/front/b/e/x.jpg',
      href: 'https://scryfall.com/card/vow/155/end-the-festivities',
      rarity: 'common',
      set: 'Innistrad: Crimson Vow',
      foil: false,
    });
  });
  it('uses the front face of double-faced cards', () => {
    const dfc = card({ image_uris: undefined, card_faces: [{ image_uris: { normal: 'https://cards.scryfall.io/front.jpg' } }, { image_uris: { normal: 'https://cards.scryfall.io/back.jpg' } }] });
    expect(parseCard(dfc)?.image).toBe('https://cards.scryfall.io/front.jpg');
  });
  it('marks rares and mythics as foil', () => {
    expect(parseCard(card({ rarity: 'rare' }))?.foil).toBe(true);
    expect(parseCard(card({ rarity: 'mythic' }))?.foil).toBe(true);
    expect(parseCard(card({ rarity: 'uncommon' }))?.foil).toBe(false);
  });
  it('defaults an unknown rarity to common', () => {
    expect(parseCard(card({ rarity: 'bonus' }))?.rarity).toBe('common');
  });
  it.each([
    null,
    'card',
    { object: 'error', details: 'Not found' },
    card({ image_uris: undefined }),
    card({ image_uris: { normal: 'javascript:alert(1)' } }),
    card({ scryfall_uri: 'http://insecure.example' }),
    card({ name: 42 }),
  ])('rejects unusable input %#', (v) => expect(parseCard(v)).toBeNull());
});

describe('boosterQueries', () => {
  it('builds a 5-card pack: 3 commons, 1 uncommon, 1 rare slot last', () => {
    const q = boosterQueries(0.5);
    expect(q).toHaveLength(5);
    expect(q.slice(0, 3).every((s) => s.startsWith('r:common'))).toBe(true);
    expect(q[3]).toMatch(/^r:uncommon/);
    expect(q[4]).toMatch(/^r:rare/);
  });
  it('opens a mythic about 1 in 8', () => {
    expect(boosterQueries(0.05)[4]).toMatch(/^r:mythic/);
    expect(boosterQueries(0.2)[4]).toMatch(/^r:rare/);
  });
  it('excludes tokens and joke cards from every slot', () => {
    for (const q of boosterQueries(0.5)) expect(q).toMatch(/-t:token/);
  });
});
