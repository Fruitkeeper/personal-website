import { describe, expect, it } from 'vitest';
import { ENTER_RATIO, EXIT_RATIO, MIN_SCROLLABLE_RATIO, nextSplitState } from '../src/lib/split';

const VH = 1000;
const LONG_PAGE = 5000;
const ENTER = VH * ENTER_RATIO;
const EXIT = VH * EXIT_RATIO;

describe('nextSplitState', () => {
  it('stays at start at the top of the page', () => {
    expect(nextSplitState('start', 0, VH, LONG_PAGE)).toBe('start');
  });
  it('swaps to end once scrolled past the enter threshold', () => {
    expect(nextSplitState('start', ENTER + 1, VH, LONG_PAGE)).toBe('end');
  });
  it('does not swap exactly at the enter threshold', () => {
    expect(nextSplitState('start', ENTER, VH, LONG_PAGE)).toBe('start');
  });
  it('stays at end far down the page', () => {
    expect(nextSplitState('end', 4000, VH, LONG_PAGE)).toBe('end');
  });
  it('swaps back to start above the exit threshold', () => {
    expect(nextSplitState('end', EXIT - 1, VH, LONG_PAGE)).toBe('start');
  });

  describe('hysteresis: between the thresholds, the current state is kept', () => {
    const between = (ENTER + EXIT) / 2;
    it('start stays start', () => expect(nextSplitState('start', between, VH, LONG_PAGE)).toBe('start'));
    it('end stays end', () => expect(nextSplitState('end', between, VH, LONG_PAGE)).toBe('end'));
    it('jittering around the enter threshold swaps only once', () => {
      let state = nextSplitState('start', ENTER + 1, VH, LONG_PAGE);
      for (const y of [ENTER - 5, ENTER + 5, ENTER - 5, ENTER + 5]) state = nextSplitState(state, y, VH, LONG_PAGE);
      expect(state).toBe('end');
    });
  });

  it('reaches end from a restored mid-page scroll on load', () => {
    expect(nextSplitState('start', 2500, VH, LONG_PAGE)).toBe('end');
  });
  it('treats negative scroll (iOS overscroll bounce) as the top', () => {
    expect(nextSplitState('end', -120, VH, LONG_PAGE)).toBe('start');
  });

  it('never swaps on pages that barely scroll', () => {
    const maxScroll = VH * MIN_SCROLLABLE_RATIO - 1;
    expect(nextSplitState('start', maxScroll, VH, maxScroll)).toBe('start');
  });
  it('resets to start if the page becomes too short (e.g. resized window)', () => {
    expect(nextSplitState('end', 300, VH, 100)).toBe('start');
  });
  it('swaps on pages just long enough', () => {
    const maxScroll = VH * MIN_SCROLLABLE_RATIO;
    expect(nextSplitState('start', maxScroll, VH, maxScroll)).toBe('end');
  });
  it.each([0, -1, NaN])('returns start for a degenerate viewport height (%s)', (vh) => {
    expect(nextSplitState('end', 500, vh, LONG_PAGE)).toBe('start');
  });
});
