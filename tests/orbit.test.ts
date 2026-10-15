import { describe, expect, it } from 'vitest';
import { INNER_RING, OUTER_RING, moonAngle, placeOnOrbit, ringRadii } from '../src/lib/orbit';

describe('ringRadii', () => {
  it('scales the rings to the stage', () => {
    const { inner, outer } = ringRadii(600, 600, 40);
    expect(inner.x).toBeCloseTo(600 * INNER_RING.x);
    expect(outer.y).toBeCloseTo(600 * OUTER_RING.y);
  });
  it('keeps the outer ring outside the inner one', () => {
    const { inner, outer } = ringRadii(600, 640, 40);
    expect(outer.x).toBeGreaterThan(inner.x);
    expect(outer.y).toBeGreaterThan(inner.y);
  });
  it.each([
    [600, 640, 44],
    [390, 370, 36],
    [200, 120, 44],
  ])('never lets a moon leave a %s×%s stage', (w, h, moon) => {
    for (const r of Object.values(ringRadii(w, h, moon))) {
      expect(r.x + moon / 2).toBeLessThanOrEqual(w / 2 + 1e-9);
      expect(r.y + moon / 2).toBeLessThanOrEqual(h / 2 + 1e-9);
    }
  });
  it('is zero for an empty stage', () => {
    expect(ringRadii(0, 500, 40)).toEqual({ inner: { x: 0, y: 0 }, outer: { x: 0, y: 0 } });
  });
});

describe('moonAngle', () => {
  it('spaces moons evenly', () => {
    expect(moonAngle(1, 4, 0, 40)).toBeCloseTo(Math.PI / 2);
    expect(moonAngle(2, 4, 0, 40)).toBeCloseTo(Math.PI);
  });
  it('turns a quarter in a quarter period, backwards for a negative period', () => {
    expect(moonAngle(0, 4, 10, 40)).toBeCloseTo(Math.PI / 2);
    expect(moonAngle(0, 4, 10, -40)).toBeCloseTo(-Math.PI / 2);
  });
  it('wraps instead of growing without bound', () => {
    expect(moonAngle(0, 1, 40 * 1000 + 10, 40)).toBeCloseTo(Math.PI / 2);
  });
  it('applies the ring offset', () => expect(moonAngle(0, 3, 0, 40, 0.5)).toBeCloseTo(0.5));
  it('ignores bad time or period', () => {
    expect(moonAngle(1, 2, NaN, 40)).toBeCloseTo(Math.PI);
    expect(moonAngle(1, 2, 5, 0)).toBeCloseTo(Math.PI);
  });
});

describe('placeOnOrbit', () => {
  it('places points on the ellipse', () => {
    expect(placeOnOrbit(0, { x: 200, y: 150 })).toEqual({ x: 200, y: 0 });
    const p = placeOnOrbit(Math.PI / 2, { x: 200, y: 150 });
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(150);
  });
});
