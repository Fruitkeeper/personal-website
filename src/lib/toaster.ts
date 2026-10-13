// Pure math for the hero toaster scene (scripts/toaster-scene.ts), kept
// free of three.js so it can be unit tested.

export type Size3 = { x: number; y: number; z: number };

/**
 * Camera distance at which an object of `size` fits the view with `margin`
 * (0.2 = 20% breathing room), for a perspective camera with vertical
 * `fovDeg` and `aspect` = width / height. Uses the bounding sphere, so the
 * object never clips while it rotates.
 */
export function fitDistance(size: Size3, fovDeg: number, aspect: number, margin = 0.2): number {
  const radius = Math.hypot(size.x, size.y, size.z) / 2;
  if (!(radius > 0) || !(fovDeg > 0) || !(aspect > 0)) return 5;
  const vFov = (fovDeg * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  // Whichever axis is tighter decides the distance.
  const limitingFov = Math.min(vFov, hFov);
  return (radius * (1 + margin)) / Math.sin(limitingFov / 2);
}

/** Seconds a click "hop" lasts. */
export const HOP_DURATION = 0.9;

/**
 * Vertical offset of a hop `t` seconds after it starts, in units of the hop
 * height: a quick jump and a damped bounce, then exactly 0. Negative t → 0.
 */
export function hopOffset(t: number): number {
  if (!(t > 0) || t >= HOP_DURATION) return 0;
  const p = t / HOP_DURATION;
  return Math.abs(Math.sin(p * Math.PI * 2.5)) * Math.pow(1 - p, 2);
}

/** Idle sway: small yaw oscillation in radians, so the face stays mostly forward. */
export function idleYaw(elapsed: number, amplitude = 0.35): number {
  return Math.sin(elapsed * 0.6) * amplitude;
}

/** How far the head can turn, in radians. Up gets more range than down: looking up is the expressive one. */
export const MAX_HEAD_YAW = 1.0; // ~57°
export const MAX_HEAD_PITCH_UP = 0.6; // ~34°
export const MAX_HEAD_PITCH_DOWN = 0.3; // ~17°

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Head angles to look at the cursor. `dx`, `dy` are the cursor's offset from
 * the toaster in CSS pixels (y down). `reachX`/`reachY` are the offsets at
 * which the head is fully turned — measured per axis, so on a wide screen the
 * top edge still means "look all the way up". Cursor right → positive yaw;
 * above → positive pitch.
 */
export function headAngles(
  dx: number,
  dy: number,
  reachX: number,
  reachY: number,
): { yaw: number; pitch: number } {
  if (!(reachX > 0 && reachY > 0) || !Number.isFinite(dx) || !Number.isFinite(dy)) return { yaw: 0, pitch: 0 };
  const up = clamp((0 - dy) / reachY, -1, 1); // 0 - dy, not -dy: avoids -0
  return {
    yaw: clamp(dx / reachX, -1, 1) * MAX_HEAD_YAW,
    pitch: up * (up > 0 ? MAX_HEAD_PITCH_UP : MAX_HEAD_PITCH_DOWN),
  };
}
