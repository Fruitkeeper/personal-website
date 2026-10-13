import { describe, expect, it } from 'vitest';
import {
  MAX_RENDER_PIXELS,
  MAX_RIPPLES,
  QUALITY_LEVELS,
  RIPPLE_LIFETIME,
  SLOW_FRAME_MS,
  adaptQuality,
  addRipple,
  packRipples,
  parseHexColor,
  renderSize,
  toShaderSpace,
  type Ripple,
} from '../src/lib/background';

const FALLBACK: [number, number, number] = [0.1, 0.2, 0.3];

describe('parseHexColor', () => {
  it('parses #rrggbb', () => expect(parseHexColor('#ff8000', FALLBACK)).toEqual([1, 128 / 255, 0]));
  it('parses #rgb shorthand', () => expect(parseHexColor('#fff', FALLBACK)).toEqual([1, 1, 1]));
  it('is case-insensitive and trims whitespace', () =>
    expect(parseHexColor('  #FF0000 ', FALLBACK)).toEqual([1, 0, 0]));
  it.each(['', 'red', 'rgb(1,2,3)', '#12', '#12345', '#gggggg', '#ff00ff00'])(
    'falls back for %j',
    (v) => expect(parseHexColor(v, FALLBACK)).toBe(FALLBACK),
  );
});

const ripple = (start: number, strength = 1): Ripple => ({ x: 0, y: 0, start, strength });

describe('addRipple', () => {
  it('appends to an empty list', () => expect(addRipple([], ripple(0))).toEqual([ripple(0)]));
  it('caps at MAX_RIPPLES, replacing the oldest', () => {
    let list: Ripple[] = [];
    for (let t = 0; t < MAX_RIPPLES + 2; t++) list = addRipple(list, ripple(t * 0.1));
    expect(list).toHaveLength(MAX_RIPPLES);
    expect(list[0].start).toBeCloseTo(0.2);
    expect(list.at(-1)!.start).toBeCloseTo((MAX_RIPPLES + 1) * 0.1);
  });
  it('drops expired ripples', () => {
    const list = addRipple([ripple(0), ripple(1)], ripple(RIPPLE_LIFETIME + 0.5));
    expect(list.map((r) => r.start)).toEqual([1, RIPPLE_LIFETIME + 0.5]);
  });
  it('does not mutate its input', () => {
    const input = [ripple(0)];
    addRipple(input, ripple(1));
    expect(input).toHaveLength(1);
  });
});

describe('packRipples', () => {
  it('always returns MAX_RIPPLES vec4s, zero-padded', () => {
    const packed = packRipples([{ x: 1, y: 2, start: 3, strength: 4 }]);
    expect(packed).toHaveLength(MAX_RIPPLES * 4);
    expect([...packed.slice(0, 4)]).toEqual([1, 2, 3, 4]);
    expect([...packed.slice(4)].every((v) => v === 0)).toBe(true);
  });
  it('keeps only the newest when given too many', () => {
    const many = Array.from({ length: MAX_RIPPLES + 1 }, (_, i) => ripple(i));
    expect(packRipples(many)[2]).toBe(1); // first slot's start = second ripple
  });
});

describe('toShaderSpace', () => {
  it('maps the center to the origin', () => expect(toShaderSpace(500, 400, 1000, 800)).toEqual([0, 0]));
  it('flips y so up is positive', () => expect(toShaderSpace(500, 0, 1000, 800)[1]).toBe(0.5));
  it('uses viewport height as the unit for both axes', () =>
    expect(toShaderSpace(1000, 400, 1000, 800)[0]).toBe(0.625));
  it('handles a zero-height viewport', () => expect(toShaderSpace(10, 10, 100, 0)).toEqual([0, 0]));
});

describe('renderSize', () => {
  it('scales CSS pixels', () => expect(renderSize(1000, 800, 0.5)).toEqual([500, 400]));
  it('caps the total pixel count, keeping aspect ratio', () => {
    const [w, h] = renderSize(7680, 4320, 0.5);
    expect(w * h).toBeLessThanOrEqual(MAX_RENDER_PIXELS * 1.01);
    expect(w / h).toBeCloseTo(7680 / 4320, 1);
  });
  it.each([
    [0, 800],
    [800, 0],
    [NaN, 800],
  ])('returns 1×1 for degenerate size %s×%s', (w, h) => expect(renderSize(w, h, 0.5)).toEqual([1, 1]));
  it('never returns less than 1px per side', () => expect(renderSize(1, 1, 0.25)).toEqual([1, 1]));
});

describe('adaptQuality', () => {
  it('keeps quality when frames are fast', () => expect(adaptQuality(0, 10)).toBe(0));
  it('steps down when frames are slow', () => expect(adaptQuality(0, SLOW_FRAME_MS + 1)).toBe(1));
  it('never goes past the lowest level', () => {
    const last = QUALITY_LEVELS.length - 1;
    expect(adaptQuality(last, 100)).toBe(last);
  });
  it('never steps back up', () => expect(adaptQuality(2, 1)).toBe(2));
});
