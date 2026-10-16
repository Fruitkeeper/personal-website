import { describe, expect, it } from 'vitest';
import { CHESSCOM_USERNAME } from '../src/lib/chesscom';
import { about, chess, contact, credits, markets, projects, site, widgets } from '../src/config/site';

const HEX = /^#[0-9a-f]{6}$/i;

describe('site', () => {
  it('has a name and description', () => {
    expect(site.name).toBeTruthy();
    expect(site.description).toBeTruthy();
  });
});

describe('contact', () => {
  it('uses absolute https URLs for profiles', () => {
    expect(contact.github).toMatch(/^https:\/\/github\.com\/[^/]+$/);
    expect(contact.linkedin).toMatch(/^https:\/\/(www\.)?linkedin\.com\/in\/[^/]+\/?$/);
    expect(contact.x).toMatch(/^https:\/\/(x|twitter)\.com\/[^/]+$/);
  });
  it('has a plausible email (no mailto: prefix — the template adds it)', () => {
    expect(contact.email).toMatch(/^[^\s@:]+@[^\s@]+\.[^\s@]+$/);
  });
});

describe('projects', () => {
  it('has 2–6 projects with unique titles (they become element ids)', () => {
    expect(projects.length).toBeGreaterThanOrEqual(2);
    expect(projects.length).toBeLessThanOrEqual(6);
    const titles = projects.map((p) => p.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
  it('fills every field, with a headline outcome first', () => {
    for (const p of projects) {
      expect(p.title && p.summary && p.role && p.period && p.description).toBeTruthy();
      expect(p.highlights.length).toBeGreaterThan(0);
      expect(p.highlights[0].length).toBeLessThanOrEqual(130);
      expect(p.tags.length).toBeGreaterThan(0);
      expect(p.color).toMatch(HEX);
      for (const l of p.links ?? []) expect(l.href).toMatch(/^https:\/\//);
    }
  });
  it('keeps card summaries short', () => {
    for (const p of projects) expect(p.summary.length).toBeLessThanOrEqual(45);
  });
});

describe('widgets', () => {
  it('has at most one of each kind', () => {
    const kinds = widgets.map((w) => w.kind);
    expect(new Set(kinds).size).toBe(kinds.length);
  });
  it('gives every widget a title, summary and hex color', () => {
    for (const w of widgets) {
      expect(w.title && w.summary).toBeTruthy();
      expect(w.color).toMatch(HEX);
    }
  });
});

describe('markets config', () => {
  it('tracks at least one coin, by lowercase CoinGecko id', () => {
    expect(markets.coins.length).toBeGreaterThan(0);
    for (const id of markets.coins) expect(id).toMatch(/^[a-z0-9-]+$/);
  });
});

describe('chess config', () => {
  it('has an empty or valid chess.com username', () => {
    if (chess.chesscom) expect(chess.chesscom).toMatch(CHESSCOM_USERNAME);
  });
});

describe('credits', () => {
  it('credits the toaster model (required by its CC BY-NC license)', () => {
    expect(credits.some((c) => /toaster/i.test(c.work))).toBe(true);
  });
  it('has complete, absolute-linked attribution', () => {
    for (const c of credits) {
      expect(c.work && c.author && c.license).toBeTruthy();
      expect(c.href).toMatch(/^https:\/\//);
      expect(c.licenseHref).toMatch(/^https:\/\//);
    }
  });
});

describe('about', () => {
  it('has an intro', () => expect(about.intro.length).toBeGreaterThan(0));
  it('fills every role', () => {
    for (const r of about.experience) {
      expect(r.org && r.role && r.period && r.place).toBeTruthy();
      expect(r.points.length).toBeGreaterThan(0);
      expect(r.color).toMatch(HEX);
      if (r.href) expect(r.href).toMatch(/^https:\/\//);
    }
  });
  it('never publishes a phone number', () => {
    expect(JSON.stringify({ about, site, projects })).not.toMatch(/\+?\d[\d\s]{8,}\d/);
  });
});
