import { describe, expect, it } from 'vitest';
import { MAX_LOCK_MS, MIN_LOCK_MS, RISE_MS, riseOffset, unlockAt } from '../src/lib/intro';

describe('unlockAt', () => {
  it('locks for the minimum when the model is ready early', () => {
    expect(unlockAt(100)).toBe(MIN_LOCK_MS);
  });
  it('waits for the rise to finish when the model is ready later', () => {
    expect(unlockAt(1500)).toBe(1500 + RISE_MS);
  });
  it('never exceeds the maximum, however slow the model', () => {
    expect(unlockAt(60_000)).toBe(MAX_LOCK_MS);
  });
  it('assumes the maximum until the model reports ready', () => {
    expect(unlockAt(null)).toBe(MAX_LOCK_MS);
    expect(unlockAt(NaN)).toBe(MAX_LOCK_MS);
  });
  it('is always within [MIN, MAX]', () => {
    for (let t = -1000; t < 10_000; t += 250) {
      expect(unlockAt(t)).toBeGreaterThanOrEqual(MIN_LOCK_MS);
      expect(unlockAt(t)).toBeLessThanOrEqual(MAX_LOCK_MS);
    }
  });
});

describe('riseOffset', () => {
  it('starts fully below and ends in place', () => {
    expect(riseOffset(0)).toBe(-1);
    expect(riseOffset(-1)).toBe(-1);
    expect(riseOffset(RISE_MS / 1000)).toBe(0);
    expect(riseOffset(99)).toBe(0);
  });
  it('overshoots a little before settling (pops up)', () => {
    let peak = -1;
    for (let t = 0.01; t < RISE_MS / 1000; t += 0.01) peak = Math.max(peak, riseOffset(t));
    expect(peak).toBeGreaterThan(0);
    expect(peak).toBeLessThan(0.15);
  });
  it('rises quickly at first (ease-out)', () => {
    expect(riseOffset((RISE_MS / 1000) * 0.3)).toBeGreaterThan(-0.4);
  });
  it('handles NaN', () => expect(riseOffset(NaN)).toBe(-1));
});
