import { describe, expect, it } from 'vitest';
import {
  AIM_ANGLE,
  AIM_SPEED,
  MAX_SPEED,
  START,
  TOASTER,
  TOASTER_X_RANGE,
  aimVelocity,
  flickVelocity,
  launch,
  nextToasterX,
  step,
  type Shot,
} from '../src/lib/toastketball';

const run = (shot: Shot, toasterX: number, seconds = 7): Shot => {
  let s = shot;
  for (let t = 0; t < seconds && s.outcome === 'flying'; t += 1 / 60) s = step(s, 1 / 60, toasterX);
  return s;
};
const dropAt = (x: number, y = 60): Shot => ({ pos: { x, y }, vel: { x: 0, y: 0 }, time: 0, touchedRim: false, outcome: 'flying' });

describe('step', () => {
  it('pulls the toast down with gravity', () => {
    const s = step(dropAt(100), 0.1, 300);
    expect(s.pos.y).toBeGreaterThan(60);
    expect(s.vel.y).toBeGreaterThan(0);
  });
  it('scores a clean drop through the slot as a swish', () => {
    const s = run(dropAt(300), 300);
    expect(s.outcome).toBe('make');
    expect(s.touchedRim).toBe(false);
  });
  it('bounces off the rim instead of scoring', () => {
    const rimX = 300 + (TOASTER.slotHalf + TOASTER.halfWidth) / 2; // middle of the right block
    const s = run(dropAt(rimX), 300);
    expect(s.touchedRim).toBe(true);
    expect(s.outcome).toBe('miss');
  });
  it('misses when the toast lands on the floor', () => {
    expect(run(dropAt(100), 300).outcome).toBe('miss');
  });
  it('does not tunnel through the toaster at max speed', () => {
    const fast: Shot = { pos: { x: 200, y: 245 }, vel: { x: MAX_SPEED, y: 0 }, time: 0, touchedRim: false, outcome: 'flying' };
    const s = step(fast, 1 / 30, 300);
    expect(s.pos.x).toBeLessThan(300 - TOASTER.halfWidth);
  });
  it('does not mutate the input and ignores finished shots', () => {
    const before = dropAt(100);
    step(before, 0.1, 300);
    expect(before.pos.y).toBe(60);
    const done = { ...before, outcome: 'make' as const };
    expect(step(done, 0.1, 300)).toBe(done);
  });
  it('ends shots that never land', () => {
    const forever: Shot = { pos: { x: 200, y: -1e6 }, vel: { x: 0, y: -1e6 }, time: 0, touchedRim: false, outcome: 'flying' };
    expect(run(forever, 300, 8).outcome).toBe('miss');
  });
});

describe('aim (keyboard)', () => {
  it.each([TOASTER_X_RANGE[0], 290, TOASTER_X_RANGE[1]])('has at least one aim that scores with the toaster at x=%s', (x) => {
    let makes = 0;
    for (let a = AIM_ANGLE[0]; a <= AIM_ANGLE[1]; a += 1)
      for (let s = AIM_SPEED[0]; s <= AIM_SPEED[1]; s += 10) if (run(launch(aimVelocity(a, s)), x).outcome === 'make') makes++;
    expect(makes).toBeGreaterThan(0);
  });
  it('clamps angle and speed', () => {
    expect(aimVelocity(500, 1e9)).toEqual(aimVelocity(AIM_ANGLE[1], AIM_SPEED[1]));
  });
  it('launches up and to the right', () => {
    const v = aimVelocity(45, 500);
    expect(v.x).toBeGreaterThan(0);
    expect(v.y).toBeLessThan(0);
  });
});

describe('flickVelocity', () => {
  it('measures only the final stretch of the flick, not the wind-up', () => {
    const v = flickVelocity([
      { x: 0, y: 0, t: 0 },
      { x: 1, y: 0, t: 390 }, // slow wind-up, outside the 100ms window
      { x: 21, y: -20, t: 450 },
      { x: 41, y: -40, t: 500 },
    ])!;
    // From t=450 to t=500: 20 units in 50ms → 400/s each axis (under the cap).
    expect(v.x).toBeCloseTo(400);
    expect(v.y).toBeCloseTo(-400);
  });
  it('caps the speed', () => {
    const v = flickVelocity([
      { x: 0, y: 0, t: 0 },
      { x: 1000, y: 0, t: 50 },
    ])!;
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(MAX_SPEED);
  });
  it('ignores taps and slow drags', () => {
    expect(flickVelocity([{ x: 0, y: 0, t: 0 }])).toBeNull();
    expect(flickVelocity([{ x: 0, y: 0, t: 0 }, { x: 2, y: 0, t: 100 }])).toBeNull();
    expect(flickVelocity([{ x: 0, y: 0, t: 5 }, { x: 50, y: 0, t: 5 }])).toBeNull();
  });
});

describe('nextToasterX', () => {
  it('stays in range and moves somewhere new', () => {
    let seed = 1;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    let x = 290;
    for (let i = 0; i < 50; i++) {
      const next = nextToasterX(x, rand);
      expect(next).toBeGreaterThanOrEqual(TOASTER_X_RANGE[0]);
      expect(next).toBeLessThanOrEqual(TOASTER_X_RANGE[1]);
      expect(Math.abs(next - x)).toBeGreaterThan(0);
      x = next;
    }
  });
  it('still moves with a stuck random source', () => {
    expect(nextToasterX(300, () => 0.6)).not.toBe(300);
  });
});

it('starts the toast left of every toaster position', () => {
  expect(START.x).toBeLessThan(TOASTER_X_RANGE[0] - TOASTER.halfWidth);
});
