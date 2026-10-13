import { describe, expect, it } from 'vitest';
import {
  formatDate,
  isoDate,
  isVisible,
  preparePosts,
  readingTime,
  sortNewestFirst,
} from '../src/lib/posts';

const post = (date: string, draft?: boolean) => ({
  id: date,
  data: { pubDate: new Date(date), draft },
});

describe('isVisible', () => {
  it('shows drafts in dev', () => {
    expect(isVisible(post('2026-01-01', true), false)).toBe(true);
  });
  it('hides drafts in production', () => {
    expect(isVisible(post('2026-01-01', true), true)).toBe(false);
  });
  it('shows published posts in production', () => {
    expect(isVisible(post('2026-01-01', false), true)).toBe(true);
  });
  it('treats a missing draft flag as published', () => {
    expect(isVisible(post('2026-01-01'), true)).toBe(true);
  });
});

describe('sortNewestFirst', () => {
  it('orders by date descending', () => {
    const sorted = sortNewestFirst([post('2025-01-01'), post('2026-06-01'), post('2025-12-31')]);
    expect(sorted.map((p) => p.id)).toEqual(['2026-06-01', '2025-12-31', '2025-01-01']);
  });
  it('does not mutate the input', () => {
    const input = [post('2025-01-01'), post('2026-01-01')];
    sortNewestFirst(input);
    expect(input.map((p) => p.id)).toEqual(['2025-01-01', '2026-01-01']);
  });
  it('handles an empty list', () => {
    expect(sortNewestFirst([])).toEqual([]);
  });
});

describe('preparePosts', () => {
  it('filters drafts and sorts in production', () => {
    const result = preparePosts(
      [post('2025-01-01'), post('2026-01-01', true), post('2025-06-01')],
      true,
    );
    expect(result.map((p) => p.id)).toEqual(['2025-06-01', '2025-01-01']);
  });
  it('keeps drafts in dev', () => {
    expect(preparePosts([post('2025-01-01'), post('2026-01-01', true)], false)).toHaveLength(2);
  });
});

describe('readingTime', () => {
  it('returns at least 1 minute', () => {
    expect(readingTime('')).toBe(1);
    expect(readingTime(undefined)).toBe(1);
    expect(readingTime('one two three')).toBe(1);
  });
  it('scales with word count', () => {
    expect(readingTime(Array(1100).fill('word').join(' '))).toBe(5);
  });
  it('ignores fenced code blocks', () => {
    const code = '```ts\n' + Array(2000).fill('x').join(' ') + '\n```';
    expect(readingTime(`intro ${code} outro`)).toBe(1);
  });
  it('handles irregular whitespace', () => {
    expect(readingTime('  a\n\n\tb   c  ')).toBe(1);
  });
});

describe('formatDate / isoDate', () => {
  it('formats frontmatter dates without timezone drift', () => {
    // UTC midnight would render as Jan 31 in any zone west of UTC without timeZone: 'UTC'.
    expect(formatDate(new Date('2026-02-01'))).toBe('Feb 1, 2026');
  });
  it('produces YYYY-MM-DD', () => {
    expect(isoDate(new Date('2026-10-13'))).toBe('2026-10-13');
  });
});
