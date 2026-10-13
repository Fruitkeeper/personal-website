import { describe, expect, it } from 'vitest';
import { credits, site } from '../src/config/site';

describe('site config', () => {
  it('has a name and description', () => {
    expect(site.name).toBeTruthy();
    expect(site.description).toBeTruthy();
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
