import { describe, expect, it } from 'vitest';
import { chess, contact, credits, magic, markets, widgets, site } from '../src/config/site';

describe('site config', () => {
  it('has a name, tagline and description', () => {
    expect(site.name).toBeTruthy();
    expect(site.description).toBeTruthy();
    expect(site.tagline.length).toBeGreaterThan(0);
    expect(site.tagline.length).toBeLessThanOrEqual(60);
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

describe('widgets', () => {
  it('has between 2 and 8 widgets, so the layout neither looks empty nor crowded', () => {
    expect(widgets.length).toBeGreaterThanOrEqual(2);
    expect(widgets.length).toBeLessThanOrEqual(8);
  });
  it('has unique titles (they become element ids)', () => {
    const titles = widgets.map((p) => p.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
  it('keeps summaries short', () => {
    for (const p of widgets) expect(p.summary.length).toBeLessThanOrEqual(40);
  });
  it('puts objects on both sides, at most 3 per side so they fit a laptop screen (projects share one deck)', () => {
    const count = (side: 'left' | 'right') => {
      const own = widgets.filter((w) => w.side === side && w.kind !== 'project').length;
      const deck = widgets.some((w) => w.side === side && w.kind === 'project') ? 1 : 0;
      return own + deck;
    };
    expect(count('left')).toBeGreaterThan(0);
    expect(count('right')).toBeGreaterThan(0);
    expect(Math.max(count('left'), count('right'))).toBeLessThanOrEqual(3);
  });
  it('keeps all projects on one side (they form a single deck)', () => {
    expect(new Set(widgets.filter((w) => w.kind === 'project').map((w) => w.side)).size).toBeLessThanOrEqual(1);
  });
  it('fills in project role, period and highlights', () => {
    for (const w of widgets) {
      if (w.kind !== 'project') continue;
      expect(w.role && w.period).toBeTruthy();
      expect(w.highlights.length).toBeGreaterThan(0);
    }
  });
  it('gives every widget a hex color', () => {
    for (const p of widgets) expect(p.color).toMatch(/^#[0-9a-f]{6}$/i);
  });
  it('fills in project widgets completely, with absolute https links', () => {
    for (const p of widgets) {
      if (p.kind !== 'project') continue;
      expect(p.description).toBeTruthy();
      expect(p.tags.length).toBeGreaterThan(0);
      for (const l of p.links ?? []) expect(l.href).toMatch(/^https:\/\//);
    }
  });
  it('has at most one widget of each interactive kind', () => {
    const kinds = widgets.filter((p) => p.kind !== 'project').map((p) => p.kind);
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

describe('magic config', () => {
  it('only has a note when a favorite card is set', () => {
    if (!magic.favorite) expect(magic.note).toBe('');
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

import { about } from '../src/config/site';

describe('about', () => {
  it('has an intro', () => expect(about.intro.length).toBeGreaterThan(0));
  it('fills every role', () => {
    for (const r of about.experience) {
      expect(r.org && r.role && r.period && r.place).toBeTruthy();
      expect(r.points.length).toBeGreaterThan(0);
      expect(r.color).toMatch(/^#[0-9a-f]{6}$/i);
      if (r.href) expect(r.href).toMatch(/^https:\/\//);
    }
  });
  it('never publishes a phone number', () => {
    expect(JSON.stringify(about)).not.toMatch(/\+?\d[\d\s]{8,}\d/);
  });
});
