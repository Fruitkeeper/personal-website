// Pure math for the project "solar system" around the toaster (scripts/orbit.ts).
// Each project is a planet on its own elliptical orbit (screen plane), inner
// ones close to the toaster and fast, outer ones near the screen edge and slow.

export type Radii = { x: number; y: number };

/** Seconds for the innermost planet to complete an orbit. */
export const INNER_PERIOD = 40;
/** Innermost orbit radius as a fraction of min(viewport w, h) — clears the toaster. */
export const INNER_RATIO = 0.27;
/** Spreads starting positions so no two planets begin bunched together. */
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const MAX_RADIUS: Radii = { x: 620, y: 400 };
const EDGE_GAP = 16;

/**
 * One orbit per planet, innermost first. The inner orbit is a circle that
 * clears the toaster; the outer one fills the viewport minus the planet's own
 * box (`item`) and any `reserve` (e.g. the contact dock's width). Orbits in
 * between are evenly spaced, and radii never shrink going outward.
 */
export function planetOrbits(count: number, viewportW: number, viewportH: number, item: Radii, reserve: Radii = { x: 0, y: 0 }): Radii[] {
  if (!(count > 0) || !(viewportW > 0 && viewportH > 0)) return [];
  const innerR = Math.min(viewportW, viewportH) * INNER_RATIO;
  const fit = (half: number, itemHalf: number, res: number, cap: number) =>
    Math.max(innerR, Math.min(cap, half - itemHalf - EDGE_GAP - Math.max(0, res)));
  const outer = {
    x: fit(viewportW / 2, item.x / 2, reserve.x, MAX_RADIUS.x),
    y: fit(viewportH / 2, item.y / 2, reserve.y, MAX_RADIUS.y),
  };
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    return { x: innerR + (outer.x - innerR) * t, y: innerR + (outer.y - innerR) * t };
  });
}

/** Kepler-ish: period grows with distance^1.5, so outer planets move slower. */
export function orbitPeriod(radius: number, innerRadius: number, innerPeriod = INNER_PERIOD): number {
  if (!(radius > 0) || !(innerRadius > 0)) return innerPeriod;
  return innerPeriod * Math.pow(radius / innerRadius, 1.5);
}

/** Angle (radians, in [0, 2π) + phase) of planet `index` after `time` seconds of motion. */
export function planetAngle(index: number, time: number, period: number): number {
  const phase = index * GOLDEN_ANGLE;
  if (!(period > 0) || !Number.isFinite(time)) return phase;
  const turns = (((time / period) % 1) + 1) % 1;
  return phase + turns * 2 * Math.PI;
}

/** Offset (px) from the center for a point at `angle` on an orbit. Positive y is down. */
export function placeOnOrbit(angle: number, radii: Radii): { x: number; y: number } {
  return { x: Math.cos(angle) * radii.x, y: Math.sin(angle) * radii.y };
}
