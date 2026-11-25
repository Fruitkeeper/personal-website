import { describe, expect, it } from 'vitest';
import { contact, credits, site } from '../src/config/site';

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

describe('privacy', () => {
  it('never publishes a phone number', () => {
    expect(JSON.stringify({ site, contact })).not.toMatch(/\+?\d[\d\s]{8,}\d/);
  });
});
