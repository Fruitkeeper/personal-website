import { describe, expect, it } from 'vitest';
import { ORBIT_PERIOD, advanceRotation, itemAngle, orbitRadii, placeOnRing } from '../src/lib/orbit';

describe('itemAngle', () => {
  it('spaces items evenly around the ring', () => {
    expect(itemAngle(1, 4, 0)).toBeCloseTo(Math.PI / 2);
    expect(itemAngle(2, 4, 0)).toBeCloseTo(Math.PI);
  });
  it('adds the current rotation', () => {
    expect(itemAngle(0, 4, 1.2)).toBeCloseTo(1.2);
  });
  it('handles an empty orbit', () => {
    expect(itemAngle(0, 0, 0.5)).toBe(0.5);
  });
});

describe('placeOnRing', () => {
  it('places items on the ellipse', () => {
    expect(placeOnRing(0, 400, 300)).toEqual({ x: 400, y: 0 });
    const bottom = placeOnRing(Math.PI / 2, 400, 300);
    expect(bottom.x).toBeCloseTo(0);
    expect(bottom.y).toBeCloseTo(300);
  });
  it('keeps every point within the radii', () => {
    for (let a = 0; a < 7; a += 0.3) {
      const p = placeOnRing(a, 400, 300);
      expect(Math.abs(p.x)).toBeLessThanOrEqual(400 + 1e-9);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(300 + 1e-9);
    }
  });
});

describe('orbitRadii', () => {
  const fitsOnScreen = (w: number, h: number, itemW: number, itemH: number, reserve = 0) => {
    const r = orbitRadii(w, h, itemW, itemH, reserve);
    expect(r.x + itemW / 2).toBeLessThanOrEqual(w / 2);
    expect(r.y + itemH / 2).toBeLessThanOrEqual(h / 2 - reserve);
  };
  it('keeps items fully on screen on a laptop', () => fitsOnScreen(1440, 900, 208, 70));
  it('keeps items fully on screen on a phone', () => fitsOnScreen(390, 844, 136, 80));
  it('keeps the lowest item clear of a bottom reserve', () => fitsOnScreen(1440, 900, 208, 70, 60));
  it('is taller than wide on portrait phones (ring stands up)', () => {
    const r = orbitRadii(390, 844, 136, 80);
    expect(r.y).toBeGreaterThan(r.x);
  });
  it('caps the ring on very large screens', () => {
    expect(orbitRadii(3840, 2160, 200, 70)).toEqual({ x: 560, y: 360 });
  });
  it('returns zero for a degenerate viewport', () => {
    expect(orbitRadii(0, 800, 200, 70)).toEqual({ x: 0, y: 0 });
  });
  it('never returns negative radii for items bigger than the viewport', () => {
    const r = orbitRadii(100, 100, 300, 300);
    expect(r.x).toBe(0);
    expect(r.y).toBe(0);
  });
});

describe('advanceRotation', () => {
  it('completes a revolution in one period', () => {
    expect(advanceRotation(0, ORBIT_PERIOD / 4)).toBeCloseTo(Math.PI / 2);
  });
  it('wraps into [0, 2π)', () => {
    const r = advanceRotation(6, ORBIT_PERIOD);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThan(2 * Math.PI);
    expect(r).toBeCloseTo(6);
  });
  it('ignores bad input', () => {
    expect(advanceRotation(1, NaN)).toBe(1);
    expect(advanceRotation(1, 1, 0)).toBe(1);
  });
});
