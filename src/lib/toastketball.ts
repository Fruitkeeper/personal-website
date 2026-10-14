// Pure physics for Toast-ketball (scripts/toastketball.ts): flick a slice of
// toast into the toaster's slot. Coordinates are a fixed world (WORLD_W ×
// WORLD_H, y down) scaled to the canvas, so physics is resolution-independent.

export const WORLD_W = 400;
export const WORLD_H = 300;
export const GRAVITY = 900; // world units / s²
export const TOAST_R = 10;
export const START = { x: 60, y: 250 };
export const FLOOR_Y = 290;
const RESTITUTION = 0.55;
const MAX_FLIGHT_S = 6;

/** Toaster geometry for a given center x: the body and its slot opening. */
export const TOASTER = { halfWidth: 45, top: 200, bottom: FLOOR_Y, slotHalf: 22 };
export const TOASTER_X_RANGE: [number, number] = [230, 345];

export type Vec = { x: number; y: number };
export type Shot = {
  pos: Vec;
  vel: Vec;
  time: number;
  /** Touched the toaster's rim on the way (a make without this is a swish). */
  touchedRim: boolean;
  outcome: 'flying' | 'make' | 'miss';
};

export function launch(vel: Vec): Shot {
  return { pos: { ...START }, vel: { ...vel }, time: 0, touchedRim: false, outcome: 'flying' };
}

type Rect = { left: number; right: number; top: number; bottom: number };

/** The two solid blocks either side of the slot. */
export function toasterBlocks(cx: number): [Rect, Rect] {
  const { halfWidth, top, bottom, slotHalf } = TOASTER;
  return [
    { left: cx - halfWidth, right: cx - slotHalf, top, bottom },
    { left: cx + slotHalf, right: cx + halfWidth, top, bottom },
  ];
}

/** Push a circle out of a rect and reflect its velocity. Returns true on contact. */
function collide(shot: Shot, r: Rect): boolean {
  const cx = Math.max(r.left, Math.min(shot.pos.x, r.right));
  const cy = Math.max(r.top, Math.min(shot.pos.y, r.bottom));
  const dx = shot.pos.x - cx;
  const dy = shot.pos.y - cy;
  const d2 = dx * dx + dy * dy;
  if (d2 >= TOAST_R * TOAST_R) return false;
  const d = Math.sqrt(d2) || 1e-6;
  // Center inside the rect (d≈0): push up, the likeliest way in.
  const nx = d2 === 0 ? 0 : dx / d;
  const ny = d2 === 0 ? -1 : dy / d;
  shot.pos.x = cx + nx * TOAST_R;
  shot.pos.y = cy + ny * TOAST_R;
  const vn = shot.vel.x * nx + shot.vel.y * ny;
  if (vn < 0) {
    shot.vel.x -= (1 + RESTITUTION) * vn * nx;
    shot.vel.y -= (1 + RESTITUTION) * vn * ny;
  }
  return true;
}

/**
 * Advance a shot by `dt` seconds against a toaster centered at `toasterX`.
 * Sub-steps internally so fast toast can't tunnel through the rim.
 * Returns a new shot; the input is not mutated.
 */
export function step(prev: Shot, dt: number, toasterX: number): Shot {
  if (prev.outcome !== 'flying' || !(dt > 0)) return prev;
  const shot: Shot = { ...prev, pos: { ...prev.pos }, vel: { ...prev.vel } };
  const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / steps;
  const slotLeft = toasterX - TOASTER.slotHalf + TOAST_R * 0.3;
  const slotRight = toasterX + TOASTER.slotHalf - TOAST_R * 0.3;
  const scoreLine = TOASTER.top + TOAST_R * 0.5;

  for (let i = 0; i < steps; i++) {
    const prevY = shot.pos.y;
    shot.vel.y += GRAVITY * h;
    shot.pos.x += shot.vel.x * h;
    shot.pos.y += shot.vel.y * h;
    shot.time += h;

    // Make: crossing into the slot, moving down, between the rims.
    if (shot.vel.y > 0 && prevY < scoreLine && shot.pos.y >= scoreLine && shot.pos.x > slotLeft && shot.pos.x < slotRight) {
      shot.outcome = 'make';
      return shot;
    }
    for (const block of toasterBlocks(toasterX)) if (collide(shot, block)) shot.touchedRim = true;

    // Side walls bounce; the floor or leaving the world ends the shot.
    if (shot.pos.x < TOAST_R) {
      shot.pos.x = TOAST_R;
      shot.vel.x = Math.abs(shot.vel.x) * RESTITUTION;
    }
    if (shot.pos.x > WORLD_W - TOAST_R) {
      shot.pos.x = WORLD_W - TOAST_R;
      shot.vel.x = -Math.abs(shot.vel.x) * RESTITUTION;
    }
    if (shot.pos.y >= FLOOR_Y - TOAST_R || shot.time > MAX_FLIGHT_S) {
      shot.pos.y = Math.min(shot.pos.y, FLOOR_Y - TOAST_R);
      shot.outcome = 'miss';
      return shot;
    }
  }
  return shot;
}

// ── Input ──────────────────────────────────────────────────────────────────

export const MIN_SPEED = 150;
export const MAX_SPEED = 900;
/** Only the last stretch of a flick counts, so a slow wind-up doesn't dampen it. */
const FLICK_WINDOW_MS = 100;

export type Sample = { x: number; y: number; t: number };

/**
 * Launch velocity from pointer samples (world units, ms timestamps), using the
 * movement in the final FLICK_WINDOW_MS. Null if the flick is too slow to
 * count as a throw; capped at MAX_SPEED.
 */
export function flickVelocity(samples: Sample[]): Vec | null {
  if (samples.length < 2) return null;
  const last = samples[samples.length - 1];
  const first = samples.find((s) => last.t - s.t <= FLICK_WINDOW_MS) ?? samples[0];
  const dt = (last.t - first.t) / 1000;
  if (!(dt > 0)) return null;
  let vx = (last.x - first.x) / dt;
  let vy = (last.y - first.y) / dt;
  const speed = Math.hypot(vx, vy);
  if (!Number.isFinite(speed) || speed < MIN_SPEED) return null;
  if (speed > MAX_SPEED) {
    vx *= MAX_SPEED / speed;
    vy *= MAX_SPEED / speed;
  }
  return { x: vx, y: vy };
}

/** Keyboard aim: angle above horizontal (degrees) and speed → launch velocity. */
export const AIM_ANGLE: [number, number] = [15, 85];
export const AIM_SPEED: [number, number] = [MIN_SPEED, MAX_SPEED];
export function aimVelocity(angleDeg: number, speed: number): Vec {
  const a = (Math.max(AIM_ANGLE[0], Math.min(AIM_ANGLE[1], angleDeg)) * Math.PI) / 180;
  const s = Math.max(AIM_SPEED[0], Math.min(AIM_SPEED[1], speed));
  return { x: Math.cos(a) * s, y: -Math.sin(a) * s };
}

/** Where the toaster moves after a make: a fresh spot, never the same one. */
export function nextToasterX(current: number, random: () => number): number {
  const [lo, hi] = TOASTER_X_RANGE;
  for (let i = 0; i < 8; i++) {
    const x = lo + random() * (hi - lo);
    if (Math.abs(x - current) > 25) return x;
  }
  return current > (lo + hi) / 2 ? lo : hi;
}
