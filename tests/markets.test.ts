import { describe, expect, it } from 'vitest';
import {
  FULL_MOOD_CHANGE,
  formatChange,
  formatPrice,
  isFresh,
  marketMood,
  moodColor,
  moodLabel,
  parseMarkets,
  sparklinePath,
} from '../src/lib/markets';

const apiCoin = (over: Record<string, unknown> = {}) => ({
  id: 'bitcoin',
  symbol: 'btc',
  name: 'Bitcoin',
  current_price: 83000,
  price_change_percentage_24h: -1.5,
  sparkline_in_7d: { price: [1, 2, 3] },
  ...over,
});

describe('parseMarkets', () => {
  it('parses a well-formed response', () => {
    expect(parseMarkets([apiCoin()])).toEqual([
      { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 83000, change24h: -1.5, sparkline: [1, 2, 3] },
    ]);
  });
  it.each([null, undefined, 'nope', 42, { error: 'rate limited' }])('returns [] for non-array %j', (v) => {
    expect(parseMarkets(v)).toEqual([]);
  });
  it('drops entries missing an id, symbol or price', () => {
    const coins = parseMarkets([apiCoin({ id: undefined }), apiCoin({ current_price: null }), apiCoin({ symbol: 3 }), null, apiCoin()]);
    expect(coins).toHaveLength(1);
  });
  it('tolerates a missing change or sparkline', () => {
    const [c] = parseMarkets([apiCoin({ price_change_percentage_24h: null, sparkline_in_7d: undefined })]);
    expect(c.change24h).toBe(0);
    expect(c.sparkline).toEqual([]);
  });
  it('filters non-numeric sparkline points', () => {
    const [c] = parseMarkets([apiCoin({ sparkline_in_7d: { price: [1, null, 'x', 2, NaN] } })]);
    expect(c.sparkline).toEqual([1, 2]);
  });
});

describe('marketMood', () => {
  it('is neutral with no data', () => expect(marketMood([])).toBe(0));
  it('averages the coins', () => expect(marketMood([{ change24h: 2 }, { change24h: -1 }])).toBeCloseTo(0.5 / FULL_MOOD_CHANGE));
  it('saturates at ±1', () => {
    expect(marketMood([{ change24h: 40 }])).toBe(1);
    expect(marketMood([{ change24h: -40 }])).toBe(-1);
  });
});

describe('moodLabel / moodColor', () => {
  it.each([
    [1, 'thrilled'],
    [0.4, 'thrilled'],
    [0.2, 'hopeful'],
    [0, 'meh'],
    [-0.09, 'meh'],
    [-0.2, 'sad'],
    [-0.4, 'devastated'],
    [-1, 'devastated'],
  ])('mood %s → %s', (m, label) => expect(moodLabel(m)).toBe(label));
  it('is green up, red down, slate flat', () => {
    expect(moodColor(0.5)).toBe('#34d399');
    expect(moodColor(-0.5)).toBe('#f87171');
    expect(moodColor(0)).toBe('#94a3b8');
  });
});

describe('sparklinePath', () => {
  it('maps the lowest value to the bottom and the highest to the top', () => {
    expect(sparklinePath([1, 3], 100, 20)).toBe('M0.0 20.0 L100.0 0.0');
  });
  it('draws a centered line for a flat series', () => {
    expect(sparklinePath([5, 5, 5], 100, 20)).toBe('M0.0 10.0 L50.0 10.0 L100.0 10.0');
  });
  it('draws nothing with fewer than two points or no size', () => {
    expect(sparklinePath([1], 100, 20)).toBe('');
    expect(sparklinePath([], 100, 20)).toBe('');
    expect(sparklinePath([1, 2], 0, 20)).toBe('');
  });
  it('ignores non-finite values', () => {
    expect(sparklinePath([1, NaN, 3], 100, 20)).toBe('M0.0 20.0 L100.0 0.0');
  });
});

describe('formatPrice / formatChange', () => {
  it('uses fewer decimals for bigger prices', () => {
    expect(formatPrice(83332.4)).toBe('$83,332');
    expect(formatPrice(42.5)).toBe('$42.50');
    expect(formatPrice(0.123456)).toBe('$0.1235');
  });
  it('signs changes with a real minus', () => {
    expect(formatChange(1.234)).toBe('+1.23%');
    expect(formatChange(-0.5)).toBe('−0.50%');
    expect(formatChange(0)).toBe('0.00%');
  });
});

describe('isFresh', () => {
  it('is fresh within the TTL', () => expect(isFresh(1000, 1500, 1000)).toBe(true));
  it('is stale after the TTL', () => expect(isFresh(1000, 2000, 1000)).toBe(false));
  it('treats a future timestamp (clock skew) as stale', () => expect(isFresh(5000, 1000, 1000)).toBe(false));
  it('treats garbage as stale', () => expect(isFresh(NaN, 1000, 1000)).toBe(false));
});
