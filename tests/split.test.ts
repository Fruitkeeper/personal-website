import { describe, expect, it } from 'vitest';
import { MIN_SCROLLABLE_RATIO, SLIDE_DISTANCE_RATIO, panelOpacity, splitProgress } from '../src/lib/split';

const VH = 1000;
const LONG_PAGE = 5000;

describe('splitProgress', () => {
  it('starts at 0 at the top of the page', () => {
    expect(splitProgress(0, VH, LONG_PAGE)).toBe(0);
  });
  it('reaches 1 after scrolling the slide distance', () => {
    expect(splitProgress(VH * SLIDE_DISTANCE_RATIO, VH, LONG_PAGE)).toBe(1);
  });
  it('stays at 1 past the slide distance', () => {
    expect(splitProgress(4000, VH, LONG_PAGE)).toBe(1);
  });
  it('is 0.5 at the halfway point (smoothstep is symmetric)', () => {
    expect(splitProgress((VH * SLIDE_DISTANCE_RATIO) / 2, VH, LONG_PAGE)).toBeCloseTo(0.5);
  });
  it('increases monotonically', () => {
    let prev = -1;
    for (let y = 0; y <= VH; y += 25) {
      const p = splitProgress(y, VH, LONG_PAGE);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });
  it('clamps negative scroll (iOS overscroll bounce) to 0', () => {
    expect(splitProgress(-120, VH, LONG_PAGE)).toBe(0);
  });
  it('completes the slide within a page shorter than the slide distance', () => {
    const maxScroll = 600; // scrollable, but less than 0.8 * VH
    expect(splitProgress(maxScroll, VH, maxScroll)).toBe(1);
  });
  it('never slides on pages that barely scroll', () => {
    const maxScroll = VH * MIN_SCROLLABLE_RATIO - 1;
    expect(splitProgress(maxScroll, VH, maxScroll)).toBe(0);
  });
  it('never slides on non-scrolling pages', () => {
    expect(splitProgress(0, VH, 0)).toBe(0);
  });
  it.each([0, -1, NaN])('returns 0 for a degenerate viewport height (%s)', (vh) => {
    expect(splitProgress(100, vh, LONG_PAGE)).toBe(0);
  });
});

describe('panelOpacity', () => {
  it('is fully opaque at both ends', () => {
    expect(panelOpacity(0)).toBe(1);
    expect(panelOpacity(1)).toBeCloseTo(1);
  });
  it('dips in the middle of the slide', () => {
    expect(panelOpacity(0.5)).toBeCloseTo(0.45);
  });
  it('clamps out-of-range progress', () => {
    expect(panelOpacity(-1)).toBe(1);
    expect(panelOpacity(2)).toBeCloseTo(1);
  });
});
