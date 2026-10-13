// "Magnetic" hover for the contact buttons (scripts/contact.ts): a button
// leans toward a nearby cursor, more strongly the closer it gets.

/**
 * Offset (px) to move a button whose center is (dx, dy) away from the cursor.
 * Zero outside `radius`; at most `maxPull` px, reached at the center. The
 * falloff is smooth so the button never jumps when the cursor enters range.
 */
export function magnetOffset(dx: number, dy: number, radius: number, maxPull: number): { x: number; y: number } {
  const dist = Math.hypot(dx, dy);
  if (!(radius > 0) || !(maxPull > 0) || !Number.isFinite(dist) || dist >= radius) return { x: 0, y: 0 };
  const t = 1 - dist / radius; // 1 at center … 0 at the edge
  const ease = t * t * (3 - 2 * t); // smoothstep
  // Pull along the cursor direction, proportional to the cursor's own offset (capped).
  const scale = (ease * maxPull) / Math.max(dist, maxPull);
  return { x: dx * scale, y: dy * scale };
}
