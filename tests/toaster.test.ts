import { describe, expect, it } from 'vitest';
import { HOP_DURATION, fitDistance, hopOffset, idleYaw } from '../src/lib/toaster';

const cube = { x: 2, y: 2, z: 2 };

describe('fitDistance', () => {
  it('backs off further for bigger objects', () => {
    expect(fitDistance({ x: 4, y: 4, z: 4 }, 35, 1)).toBeCloseTo(2 * fitDistance(cube, 35, 1));
  });
  it('backs off further on narrow (portrait) viewports', () => {
    expect(fitDistance(cube, 35, 0.5)).toBeGreaterThan(fitDistance(cube, 35, 1));
  });
  it('is limited by vertical fov on wide viewports', () => {
    expect(fitDistance(cube, 35, 3)).toBeCloseTo(fitDistance(cube, 35, 1));
  });
  it('adds more room with a bigger margin', () => {
    expect(fitDistance(cube, 35, 1, 0.5)).toBeGreaterThan(fitDistance(cube, 35, 1, 0.1));
  });
  it('keeps the bounding sphere inside the view', () => {
    const d = fitDistance(cube, 35, 1, 0);
    const radius = Math.hypot(2, 2, 2) / 2;
    expect(radius / d).toBeCloseTo(Math.sin((35 * Math.PI) / 360));
  });
  it.each([
    [{ x: 0, y: 0, z: 0 }, 35, 1],
    [cube, 0, 1],
    [cube, 35, 0],
    [{ x: NaN, y: 1, z: 1 }, 35, 1],
  ])('falls back to a sane distance for degenerate input %#', (size, fov, aspect) => {
    expect(fitDistance(size, fov, aspect)).toBe(5);
  });
});

describe('hopOffset', () => {
  it('is 0 before, at the start of, and after a hop', () => {
    expect(hopOffset(-1)).toBe(0);
    expect(hopOffset(0)).toBe(0);
    expect(hopOffset(HOP_DURATION)).toBe(0);
    expect(hopOffset(HOP_DURATION + 5)).toBe(0);
  });
  it('lifts off during the hop and never goes below the ground', () => {
    let peak = 0;
    for (let t = 0.01; t < HOP_DURATION; t += 0.01) {
      const h = hopOffset(t);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(1);
      peak = Math.max(peak, h);
    }
    expect(peak).toBeGreaterThan(0.5);
  });
  it('settles: later bounces are smaller than the first', () => {
    expect(hopOffset(HOP_DURATION * 0.85)).toBeLessThan(hopOffset(HOP_DURATION * 0.2));
  });
  it('handles NaN', () => expect(hopOffset(NaN)).toBe(0));
});

describe('idleYaw', () => {
  it('starts facing forward', () => expect(idleYaw(0)).toBe(0));
  it('stays within the amplitude', () => {
    for (let t = 0; t < 30; t += 0.37) expect(Math.abs(idleYaw(t, 0.3))).toBeLessThanOrEqual(0.3);
  });
});

import { MAX_HEAD_PITCH_DOWN, MAX_HEAD_PITCH_UP, MAX_HEAD_YAW, headAngles } from '../src/lib/toaster';

describe('headAngles', () => {
  it('looks straight ahead when the cursor is on the toaster', () => {
    expect(headAngles(0, 0, 720, 450)).toEqual({ yaw: 0, pitch: 0 });
  });
  it('turns right for a cursor to the right, left for the left', () => {
    expect(headAngles(360, 0, 720, 450).yaw).toBeCloseTo(MAX_HEAD_YAW / 2);
    expect(headAngles(-360, 0, 720, 450).yaw).toBeCloseTo(-MAX_HEAD_YAW / 2);
  });
  it('looks fully up when the cursor is at the top edge of a wide screen', () => {
    // 1440×900 screen, toaster centered: top edge is 450px up.
    expect(headAngles(0, -450, 720, 450).pitch).toBeCloseTo(MAX_HEAD_PITCH_UP);
  });
  it('looks further up than down', () => {
    expect(headAngles(0, -450, 720, 450).pitch).toBeGreaterThan(-headAngles(0, 450, 720, 450).pitch);
    expect(headAngles(0, 450, 720, 450).pitch).toBeCloseTo(-MAX_HEAD_PITCH_DOWN);
  });
  it('scales vertical tracking by height, horizontal by width', () => {
    const a = headAngles(225, -225, 720, 450);
    expect(a.pitch).toBeCloseTo(MAX_HEAD_PITCH_UP / 2);
    expect(a.yaw).toBeCloseTo(MAX_HEAD_YAW * (225 / 720));
  });
  it('clamps beyond reach so the head never over-rotates', () => {
    expect(headAngles(5000, -5000, 720, 450)).toEqual({ yaw: MAX_HEAD_YAW, pitch: MAX_HEAD_PITCH_UP });
    expect(headAngles(-5000, 5000, 720, 450)).toEqual({ yaw: -MAX_HEAD_YAW, pitch: -MAX_HEAD_PITCH_DOWN });
  });
  it.each([
    [10, 10, 0, 450],
    [10, 10, 720, 0],
    [10, 10, -5, 450],
    [NaN, 10, 720, 450],
    [10, Infinity, 720, 450],
  ])('returns neutral for degenerate input (%s, %s, %s, %s)', (dx, dy, rx, ry) => {
    expect(headAngles(dx, dy, rx, ry)).toEqual({ yaw: 0, pitch: 0 });
  });
});

import { moodPose } from '../src/lib/toaster';

describe('moodPose', () => {
  it('is the default pose when neutral', () => {
    expect(moodPose(0)).toEqual({ pitch: 0, bobAmplitude: 0.03, bobSpeed: 1.4 });
  });
  it('droops the head when markets are down, perks it up when up', () => {
    expect(moodPose(-1).pitch).toBeLessThan(0);
    expect(moodPose(1).pitch).toBeGreaterThan(0);
    expect(Math.abs(moodPose(-1).pitch)).toBeGreaterThan(moodPose(1).pitch);
  });
  it('bobs livelier when happy, sluggish when sad', () => {
    expect(moodPose(1).bobSpeed).toBeGreaterThan(moodPose(0).bobSpeed);
    expect(moodPose(-1).bobAmplitude).toBeLessThan(moodPose(0).bobAmplitude);
    expect(moodPose(-1).bobAmplitude).toBeGreaterThan(0);
  });
  it('clamps and handles bad input', () => {
    expect(moodPose(5)).toEqual(moodPose(1));
    expect(moodPose(NaN)).toEqual(moodPose(0));
  });
});
