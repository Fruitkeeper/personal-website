import { describe, expect, it } from 'vitest';
import { ORBIT_PERIOD, advanceRotation, itemAngle, layerFor, orbitRadii, placeOnOrbit, placeStatic } from '../src/lib/orbit';

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

describe('placeOnOrbit', () => {
  it('puts the nearest point in front, low on screen, full size', () => {
    const p = placeOnOrbit(Math.PI / 2, 400, 100);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(100);
    expect(p).toMatchObject({ behind: false, scale: 1, opacity: 1 });
  });
  it('puts the furthest point behind, high, small and faded', () => {
    const p = placeOnOrbit(-Math.PI / 2, 400, 100);
    expect(p.y).toBeCloseTo(-100);
    expect(p.behind).toBe(true);
    expect(p.scale).toBeLessThan(1);
    expect(p.opacity).toBeLessThan(1);
  });
  it('places the sides at full horizontal radius', () => {
    expect(placeOnOrbit(0, 400, 100).x).toBeCloseTo(400);
    expect(placeOnOrbit(Math.PI, 400, 100).x).toBeCloseTo(-400);
  });
  it('grows monotonically from back to front', () => {
    const back = placeOnOrbit(-Math.PI / 2, 400, 100);
    const side = placeOnOrbit(0, 400, 100);
    const front = placeOnOrbit(Math.PI / 2, 400, 100);
    expect(back.scale).toBeLessThan(side.scale);
    expect(side.scale).toBeLessThan(front.scale);
  });
});

describe('placeStatic', () => {
  it('keeps every item in front and fully visible', () => {
    for (const a of [0, 1, 2, 3, 4, 5]) expect(placeStatic(a, 400, 100)).toMatchObject({ behind: false, scale: 1, opacity: 1 });
  });
});

describe('orbitRadii', () => {
  it('keeps items fully on screen on a phone', () => {
    const itemW = 160;
    const { x } = orbitRadii(390, 844, itemW);
    expect(x + itemW / 2).toBeLessThanOrEqual(390 / 2);
  });
  it('caps the ring on very wide screens', () => {
    expect(orbitRadii(3840, 2160, 200).x).toBe(560);
  });
  it('stands the ring up on portrait phones so items pass above and below', () => {
    const r = orbitRadii(390, 844, 136);
    expect(r.y).toBeGreaterThan(r.x);
  });
  it('keeps the two items sharing a height apart on a phone (4 items at 45° offsets)', () => {
    const itemW = 136;
    const { x } = orbitRadii(390, 844, itemW);
    const left = placeOnOrbit((3 * Math.PI) / 4, x, 0).x;
    const right = placeOnOrbit(Math.PI / 4, x, 0).x;
    expect(right - left).toBeGreaterThan(itemW);
  });
  it('keeps the ring flatter than it is wide on landscape screens', () => {
    const r = orbitRadii(1440, 900, 200);
    expect(r.y).toBeLessThan(r.x);
    expect(r.y).toBeGreaterThan(0);
  });
  it('returns zero for a degenerate viewport', () => {
    expect(orbitRadii(0, 800, 200)).toEqual({ x: 0, y: 0 });
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

describe('layerFor', () => {
  const STAGE = 1;
  it('puts behind items under the toaster and front items over it', () => {
    expect(layerFor(-0.01)).toBeLessThan(STAGE);
    expect(layerFor(-1)).toBeLessThan(STAGE);
    expect(layerFor(0)).toBeGreaterThan(STAGE);
    expect(layerFor(1)).toBeGreaterThan(STAGE);
  });
  it('stacks nearer items over further ones', () => {
    for (let d = -1; d < 1; d += 0.1) expect(layerFor(d + 0.1)).toBeGreaterThanOrEqual(layerFor(d));
  });
  it('handles out-of-range and bad input', () => {
    expect(layerFor(5)).toBe(layerFor(1));
    expect(layerFor(-5)).toBe(layerFor(-1));
    expect(layerFor(NaN)).toBe(layerFor(0));
  });
});
