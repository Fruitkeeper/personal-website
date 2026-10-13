// Pure math for the project orbit around the toaster (scripts/orbit.ts).
// Items ride a flat ring (an ellipse in the screen plane) around the toaster,
// always in front of it, so every one is visible and clickable.

/** Seconds per full revolution. */
export const ORBIT_PERIOD = 60;

/** Gap kept between an item and the viewport edge, in px. */
const EDGE_GAP = 16;

/** Angle of item `index` of `count`, given the orbit's current rotation (radians). */
export function itemAngle(index: number, count: number, rotation: number): number {
  return rotation + (count > 0 ? (index * 2 * Math.PI) / count : 0);
}

/** Offset (px) from the ring's center for an item at `angle`. Positive y is down. */
export function placeOnRing(angle: number, radiusX: number, radiusY: number): { x: number; y: number } {
  return { x: Math.cos(angle) * radiusX, y: Math.sin(angle) * radiusY };
}

/**
 * Ring size for a viewport: as large as fits, so items clear the toaster,
 * while every item (of size itemW × itemH) stays fully on screen.
 * `bottomReserve` keeps the lowest item above UI pinned to the bottom edge.
 */
export function orbitRadii(
  viewportW: number,
  viewportH: number,
  itemW: number,
  itemH: number,
  bottomReserve = 0,
): { x: number; y: number } {
  if (!(viewportW > 0 && viewportH > 0)) return { x: 0, y: 0 };
  const maxX = Math.max(0, viewportW / 2 - itemW / 2 - EDGE_GAP);
  const maxY = Math.max(0, viewportH / 2 - itemH / 2 - EDGE_GAP - Math.max(0, bottomReserve));
  return { x: Math.min(maxX, 560), y: Math.min(maxY, 360) };
}

/** Advance the rotation by `dt` seconds. Wraps to [0, 2π) so it never grows unbounded. */
export function advanceRotation(rotation: number, dt: number, period = ORBIT_PERIOD): number {
  if (!(period > 0) || !Number.isFinite(dt)) return rotation;
  const next = rotation + (dt / period) * 2 * Math.PI;
  const full = 2 * Math.PI;
  return ((next % full) + full) % full;
}
