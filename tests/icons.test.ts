import { describe, expect, it } from 'vitest';
import { ICONS } from '../src/lib/icons';
import { projects, widgets } from '../src/config/site';

describe('ICONS', () => {
  it.each(Object.entries(ICONS))('%s is SVG drawing markup only', (_, markup) => {
    expect(markup.trim()).toMatch(/^<(path|circle|rect|ellipse|line|polyline)\b/);
    // Rendered with set:html, so nothing executable or nested <svg>.
    expect(markup).not.toMatch(/<script|<svg|on\w+=|javascript:/i);
    // Every tag is self-closed.
    expect(markup.match(/</g)!.length).toBe(markup.match(/\/>/g)!.length);
  });
});

describe('moon icons', () => {
  const moons = [...projects, ...widgets];
  it('every moon has a known icon', () => {
    for (const m of moons) expect(Object.keys(ICONS), m.title).toContain(m.icon);
  });
  it('no two moons share an icon', () => {
    const icons = moons.map((m) => m.icon);
    expect(new Set(icons).size).toBe(icons.length);
  });
});
