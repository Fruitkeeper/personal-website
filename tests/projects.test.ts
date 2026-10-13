import { describe, expect, it } from 'vitest';
import { accentOf, featuredProjects, isExternal } from '../src/lib/projects';
import { projects, site } from '../src/config/site';

describe('featuredProjects', () => {
  it('returns only featured projects', () => {
    const result = featuredProjects([
      { title: 'a', description: '', tags: [], featured: true },
      { title: 'b', description: '', tags: [] },
    ]);
    expect(result.map((p) => p.title)).toEqual(['a']);
  });
});

describe('accentOf', () => {
  it('falls back to the default gradient', () => {
    expect(accentOf({ title: 'a', description: '', tags: [] })).toHaveLength(2);
  });
  it('uses the project accent when set', () => {
    expect(accentOf({ title: 'a', description: '', tags: [], accent: ['red', 'blue'] })).toEqual([
      'red',
      'blue',
    ]);
  });
});

describe('isExternal', () => {
  it.each([
    ['https://github.com', true],
    ['HTTP://example.com', true],
    ['/blog', false],
    ['mailto:a@b.c', false],
    [undefined, false],
    ['', false],
  ])('%s → %s', (href, expected) => {
    expect(isExternal(href)).toBe(expected);
  });
});

// Guards against typos in the config, the file you'll edit most.
describe('site config', () => {
  it('has unique project titles', () => {
    const titles = projects.map((p) => p.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
  it('uses absolute URLs for social links and project links', () => {
    for (const link of site.socials) expect(link.href).toMatch(/^https?:\/\//);
    for (const p of projects) if (p.href) expect(p.href).toMatch(/^https?:\/\//);
  });
  it('uses root-relative nav links', () => {
    for (const link of site.nav) expect(link.href).toMatch(/^\//);
  });
  it('has a plausible email', () => {
    expect(site.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});

describe('credits', () => {
  it('has complete, absolute-linked attribution for every credited asset', async () => {
    const { credits } = await import('../src/config/site');
    for (const c of credits) {
      expect(c.work && c.author && c.license).toBeTruthy();
      expect(c.href).toMatch(/^https:\/\//);
      expect(c.licenseHref).toMatch(/^https:\/\//);
    }
  });
});
