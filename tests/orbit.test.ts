import { describe, expect, it } from 'vitest';
import { GOLDEN_ANGLE, INNER_PERIOD, INNER_RATIO, orbitPeriod, placeOnOrbit, planetAngle, planetOrbits } from '../src/lib/orbit';

const ITEM = { x: 150, y: 80 };

describe('planetOrbits', () => {
  it('returns one orbit per planet', () => {
    expect(planetOrbits(4, 1440, 900, ITEM)).toHaveLength(4);
  });
  it('starts with a circle that clears the toaster', () => {
    const [inner] = planetOrbits(4, 1440, 900, ITEM);
    expect(inner.x).toBeCloseTo(900 * INNER_RATIO);
    expect(inner.y).toBeCloseTo(900 * INNER_RATIO);
  });
  it('grows outward monotonically on both axes', () => {
    const orbits = planetOrbits(6, 1440, 900, ITEM);
    for (let i = 1; i < orbits.length; i++) {
      expect(orbits[i].x).toBeGreaterThanOrEqual(orbits[i - 1].x);
      expect(orbits[i].y).toBeGreaterThanOrEqual(orbits[i - 1].y);
    }
  });
  it.each([
    [1440, 900],
    [1920, 1080],
    [1024, 768],
  ])('keeps the outermost planet on screen at %s×%s (with a dock reserve)', (w, h) => {
    const reserve = { x: 72, y: 0 };
    const outer = planetOrbits(4, w, h, ITEM, reserve).at(-1)!;
    expect(outer.x + ITEM.x / 2 + reserve.x).toBeLessThanOrEqual(w / 2);
    expect(outer.y + ITEM.y / 2).toBeLessThanOrEqual(h / 2);
  });
  it('stands tall on portrait phones and still clears the toaster', () => {
    const orbits = planetOrbits(4, 390, 844, { x: 110, y: 80 });
    expect(orbits.at(-1)!.y).toBeGreaterThan(orbits.at(-1)!.x);
    expect(orbits[0].x).toBeCloseTo(390 * INNER_RATIO);
  });
  it('never shrinks below the inner orbit on tiny screens', () => {
    for (const o of planetOrbits(3, 200, 200, { x: 300, y: 300 })) {
      expect(o.x).toBeCloseTo(200 * INNER_RATIO);
      expect(o.y).toBeCloseTo(200 * INNER_RATIO);
    }
  });
  it('puts a single planet midway', () => {
    const [only] = planetOrbits(1, 1440, 900, ITEM);
    expect(only.x).toBeGreaterThan(900 * INNER_RATIO);
  });
  it('handles empty or degenerate input', () => {
    expect(planetOrbits(0, 1440, 900, ITEM)).toEqual([]);
    expect(planetOrbits(3, 0, 900, ITEM)).toEqual([]);
  });
});

describe('orbitPeriod', () => {
  it('uses the base period for the inner orbit', () => {
    expect(orbitPeriod(200, 200)).toBe(INNER_PERIOD);
  });
  it('is slower further out (Kepler: T ∝ r^1.5)', () => {
    expect(orbitPeriod(800, 200)).toBeCloseTo(INNER_PERIOD * 8);
  });
  it('falls back for bad radii', () => {
    expect(orbitPeriod(0, 200)).toBe(INNER_PERIOD);
    expect(orbitPeriod(200, 0)).toBe(INNER_PERIOD);
  });
});

describe('planetAngle', () => {
  it('starts each planet at its golden-angle phase', () => {
    expect(planetAngle(0, 0, 40)).toBe(0);
    expect(planetAngle(2, 0, 40)).toBeCloseTo(2 * GOLDEN_ANGLE);
  });
  it('advances a quarter turn in a quarter period', () => {
    expect(planetAngle(0, 10, 40)).toBeCloseTo(Math.PI / 2);
  });
  it('wraps after a full period instead of growing', () => {
    expect(planetAngle(0, 40 * 1000 + 10, 40)).toBeCloseTo(Math.PI / 2);
  });
  it('ignores bad time/period', () => {
    expect(planetAngle(1, NaN, 40)).toBeCloseTo(GOLDEN_ANGLE);
    expect(planetAngle(1, 5, 0)).toBeCloseTo(GOLDEN_ANGLE);
  });
});

describe('placeOnOrbit', () => {
  it('places points on the ellipse', () => {
    expect(placeOnOrbit(0, { x: 400, y: 300 })).toEqual({ x: 400, y: 0 });
    const bottom = placeOnOrbit(Math.PI / 2, { x: 400, y: 300 });
    expect(bottom.x).toBeCloseTo(0);
    expect(bottom.y).toBeCloseTo(300);
  });
});
