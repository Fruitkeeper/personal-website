// Pure math for the project orbit around the toaster (scripts/orbit.ts).
//
// Items ride a tilted ring: a horizontal ellipse seen from slightly above.
// sin(angle) > 0 is the half nearest the viewer (lower on screen, bigger,
// in front of the toaster); sin(angle) < 0 passes behind it.

export type OrbitPlacement = {
  /** Offset from the orbit center in px. */
  x: number;
  y: number;
  /** -1 (furthest back) … 1 (nearest the viewer). */
  depth: number;
  scale: number;
  opacity: number;
  /** True while the item is behind the toaster. */
  behind: boolean;
};

/** Seconds per full revolution. */
export const ORBIT_PERIOD = 60;
const MIN_SCALE = 0.72;
const MIN_OPACITY = 0.35;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Angle of item `index` of `count`, given the orbit's current rotation (radians). */
export function itemAngle(index: number, count: number, rotation: number): number {
  return rotation + (count > 0 ? (index * 2 * Math.PI) / count : 0);
}

export function placeOnOrbit(angle: number, radiusX: number, radiusY: number): OrbitPlacement {
  const depth = Math.sin(angle);
  const t = (depth + 1) / 2; // 0 back … 1 front
  return {
    x: Math.cos(angle) * radiusX,
    y: depth * radiusY,
    depth,
    scale: lerp(MIN_SCALE, 1, t),
    opacity: lerp(MIN_OPACITY, 1, t),
    behind: depth < 0,
  };
}

/** Flat, readable layout for reduced motion: all items in front, full size. */
export function placeStatic(angle: number, radiusX: number, radiusY: number): OrbitPlacement {
  return { x: Math.cos(angle) * radiusX, y: Math.sin(angle) * radiusY, depth: 1, scale: 1, opacity: 1, behind: false };
}

/**
 * Ring size for a viewport: wide enough to clear the toaster, narrow enough
 * that items stay on screen. Item width is accounted for so they never clip.
 * Landscape gets a wide, flat ring. Portrait (phones) can't fit that, so the
 * ring stands up: items pass above and below the toaster instead of beside it.
 */
export function orbitRadii(viewportW: number, viewportH: number, itemW: number): { x: number; y: number } {
  if (!(viewportW > 0 && viewportH > 0)) return { x: 0, y: 0 };
  const maxX = Math.max(0, viewportW / 2 - itemW / 2 - 16);
  const x = Math.min(maxX, Math.max(viewportW * 0.36, 240), 560);
  const portrait = viewportH > viewportW * 1.2;
  const y = portrait ? viewportH * 0.3 : Math.min(viewportH * 0.3, x * 0.45);
  return { x, y };
}

/**
 * z-index for an item at `depth`, relative to the toaster stage at z-index 1:
 * behind items get ≤ 0, front items ≥ 2, and nearer items always stack over
 * further ones, so overlapping chips read correctly.
 */
export function layerFor(depth: number): number {
  const d = Math.max(-1, Math.min(1, Number.isFinite(depth) ? depth : 0));
  return d < 0 ? Math.round(d * 10) - 1 : Math.round(d * 10) + 2;
}

/** Advance the rotation by `dt` seconds. Wraps to [0, 2π) so it never grows unbounded. */
export function advanceRotation(rotation: number, dt: number, period = ORBIT_PERIOD): number {
  if (!(period > 0) || !Number.isFinite(dt)) return rotation;
  const next = rotation + (dt / period) * 2 * Math.PI;
  const full = 2 * Math.PI;
  return ((next % full) + full) % full;
}
