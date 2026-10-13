import { describe, expect, it } from 'vitest';
import { contact, credits, projects, site } from '../src/config/site';

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

describe('projects', () => {
  it('has between 2 and 8 projects, so the orbit neither looks empty nor overlaps', () => {
    expect(projects.length).toBeGreaterThanOrEqual(2);
    expect(projects.length).toBeLessThanOrEqual(8);
  });
  it('has unique titles (they become element ids)', () => {
    const titles = projects.map((p) => p.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
  it('keeps card summaries short enough for the orbit chip', () => {
    for (const p of projects) expect(p.summary.length).toBeLessThanOrEqual(40);
  });
  it('fills in every field', () => {
    for (const p of projects) {
      expect(p.title && p.summary && p.description).toBeTruthy();
      expect(p.tags.length).toBeGreaterThan(0);
    }
  });
  it('uses absolute https links', () => {
    for (const p of projects) for (const l of p.links ?? []) expect(l.href).toMatch(/^https:\/\//);
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
