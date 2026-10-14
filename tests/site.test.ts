import { describe, expect, it } from 'vitest';
import { chess, contact, credits, markets, planets, site } from '../src/config/site';

describe('site config', () => {
  it('has a name and description', () => {
    expect(site.name).toBeTruthy();
    expect(site.description).toBeTruthy();
  });
  it('uses absolute https URLs for profiles', () => {
    expect(contact.github).toMatch(/^https:\/\/github\.com\/[^/]+$/);
    expect(contact.linkedin).toMatch(/^https:\/\/(www\.)?linkedin\.com\/in\/[^/]+\/?$/);
    expect(contact.x).toMatch(/^https:\/\/(x|twitter)\.com\/[^/]+$/);
  });
  it('has a plausible email (no mailto: prefix — the template adds it)', () => {
    expect(contact.email).toMatch(/^[^\s@:]+@[^\s@]+\.[^\s@]+$/);
  });
});

describe('planets', () => {
  it('has between 2 and 8 planets, so the system neither looks empty nor crowded', () => {
    expect(planets.length).toBeGreaterThanOrEqual(2);
    expect(planets.length).toBeLessThanOrEqual(8);
  });
  it('has unique titles (they become element ids)', () => {
    const titles = planets.map((p) => p.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
  it('keeps hover summaries short', () => {
    for (const p of planets) expect(p.summary.length).toBeLessThanOrEqual(40);
  });
  it('gives every planet a hex color', () => {
    for (const p of planets) expect(p.color).toMatch(/^#[0-9a-f]{6}$/i);
  });
  it('fills in project planets completely, with absolute https links', () => {
    for (const p of planets) {
      if (p.kind !== 'project') continue;
      expect(p.description).toBeTruthy();
      expect(p.tags.length).toBeGreaterThan(0);
      for (const l of p.links ?? []) expect(l.href).toMatch(/^https:\/\//);
    }
  });
  it('has at most one planet of each interactive kind', () => {
    const kinds = planets.filter((p) => p.kind !== 'project').map((p) => p.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
  });
});

describe('markets config', () => {
  it('tracks at least one coin, by lowercase CoinGecko id', () => {
    expect(markets.coins.length).toBeGreaterThan(0);
    for (const id of markets.coins) expect(id).toMatch(/^[a-z0-9-]+$/);
  });
});

describe('chess config', () => {
  it('has an empty or plausible Lichess username', () => {
    expect(chess.lichess).toMatch(/^([A-Za-z0-9_-]{2,30})?$/);
  });
});

describe('credits', () => {
  it('credits the toaster model (required by its CC BY-NC license)', () => {
    expect(credits.some((c) => /toaster/i.test(c.work))).toBe(true);
  });
  it('has complete, absolute-linked attribution for every credited asset', () => {
    for (const c of credits) {
      expect(c.work && c.author && c.license).toBeTruthy();
      expect(c.href).toMatch(/^https:\/\//);
      expect(c.licenseHref).toMatch(/^https:\/\//);
    }
  });
});
