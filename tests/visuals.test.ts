import { describe, expect, it } from 'vitest';
import { paletteStyle, palettes } from '../src/lib/visuals';

describe('palettes', () => {
  it.each(Object.entries(palettes))('%s has three valid hex colors', (_, colors) => {
    expect(colors).toHaveLength(3);
    for (const c of colors) expect(c).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('paletteStyle', () => {
  it('maps the palette to the accent custom properties', () => {
    expect(paletteStyle('home')).toBe('--accent-1: #7c5cff; --accent-2: #22d3ee; --accent-3: #f472b6;');
  });
});
