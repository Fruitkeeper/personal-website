import { describe, expect, it } from 'vitest';
import { magnetOffset } from '../src/lib/magnet';

describe('magnetOffset', () => {
  it('does nothing when the cursor is out of range', () => {
    expect(magnetOffset(100, 0, 80, 10)).toEqual({ x: 0, y: 0 });
    expect(magnetOffset(80, 0, 80, 10)).toEqual({ x: 0, y: 0 });
  });
  it('pulls toward the cursor', () => {
    const o = magnetOffset(20, -20, 80, 10);
    expect(o.x).toBeGreaterThan(0);
    expect(o.y).toBeLessThan(0);
  });
  it('never pulls further than maxPull', () => {
    for (let d = 0; d < 80; d += 2) {
      const o = magnetOffset(d, d / 2, 80, 10);
      expect(Math.hypot(o.x, o.y)).toBeLessThanOrEqual(10 + 1e-9);
    }
  });
  it('fades in smoothly from the edge (no jump on entering range)', () => {
    const nearEdge = magnetOffset(79, 0, 80, 10);
    expect(Math.hypot(nearEdge.x, nearEdge.y)).toBeLessThan(0.1);
  });
  it('is zero with the cursor dead center (no direction to pull)', () => {
    expect(magnetOffset(0, 0, 80, 10)).toEqual({ x: 0, y: 0 });
  });
  it.each([
    [NaN, 0, 80, 10],
    [10, 10, 0, 10],
    [10, 10, 80, 0],
  ])('returns zero for bad input %#', (dx, dy, r, m) => {
    expect(magnetOffset(dx, dy, r, m)).toEqual({ x: 0, y: 0 });
  });
});
