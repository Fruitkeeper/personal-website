// Pure math for the moons orbiting the toaster in the hero (scripts/orbit.ts).
// Two flat elliptical rings sized to the toaster's stage: projects on the
// inner ring, interests on the outer one.

export type Radii = { x: number; y: number };

/** Ring sizes as fractions of the stage, chosen to clear the framed toaster. */
export const INNER_RING: Radii = { x: 0.33, y: 0.3 };
export const OUTER_RING: Radii = { x: 0.46, y: 0.42 };

/** Seconds per revolution. The outer ring is slower and turns the other way. */
export const INNER_PERIOD = 46;
export const OUTER_PERIOD = -70;

/**
 * Pixel radii for both rings in a `width` × `height` stage, shrunk if needed
 * so a moon of `moonSize` px never pokes out of the stage.
 */
export function ringRadii(width: number, height: number, moonSize: number): { inner: Radii; outer: Radii } {
  if (!(width > 0 && height > 0)) return { inner: { x: 0, y: 0 }, outer: { x: 0, y: 0 } };
  const fit = (r: Radii): Radii => ({
    x: Math.max(0, Math.min(width * r.x, width / 2 - moonSize / 2)),
    y: Math.max(0, Math.min(height * r.y, height / 2 - moonSize / 2)),
  });
  return { inner: fit(INNER_RING), outer: fit(OUTER_RING) };
}

/**
 * Angle of moon `index` of `count` on a ring after `time` seconds: evenly
 * spaced, plus the ring's rotation. A negative period turns the other way.
 * `offset` staggers rings so their moons don't line up at the start.
 */
export function moonAngle(index: number, count: number, time: number, period: number, offset = 0): number {
  const spacing = count > 0 ? (index * 2 * Math.PI) / count : 0;
  if (!period || !Number.isFinite(period) || !Number.isFinite(time)) return offset + spacing;
  const turns = (time / period) % 1;
  return offset + spacing + turns * 2 * Math.PI;
}

/** Offset (px) from the stage center for a point at `angle` on a ring. Positive y is down. */
export function placeOnOrbit(angle: number, radii: Radii): { x: number; y: number } {
  return { x: Math.cos(angle) * radii.x, y: Math.sin(angle) * radii.y };
}
