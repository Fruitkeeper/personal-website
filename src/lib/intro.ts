// Timing for the page-load intro (scripts/intro.ts): the lamp lights up, the
// toaster rises into the light, and only then can the visitor interact.

/** The lock lasts at least this long — the lamp's own animation is ~1.1s. */
export const MIN_LOCK_MS = 2000;
/** …and never longer than this, even if the 3D model is slow to load. */
export const MAX_LOCK_MS = 4500;
/** How long the toaster takes to rise once its model is ready. */
export const RISE_MS = 1400;

/**
 * Milliseconds after page start to unlock. Waits for the rise to finish if the
 * model became ready (at `readyAtMs`) late, but stays within [MIN, MAX]. With
 * no ready signal yet, assume the worst case (MAX); a later ready signal can
 * bring it earlier.
 */
export function unlockAt(readyAtMs: number | null): number {
  if (readyAtMs === null || !Number.isFinite(readyAtMs)) return MAX_LOCK_MS;
  return Math.min(MAX_LOCK_MS, Math.max(MIN_LOCK_MS, readyAtMs + RISE_MS));
}

/**
 * Vertical offset of the rising toaster, in units of its rise depth:
 * -1 = fully below (start), 0 = in place. Ease-out with a small overshoot,
 * so it pops up and settles. `t` is seconds since the rise started.
 */
export function riseOffset(t: number, durationS = RISE_MS / 1000): number {
  if (!(t > 0)) return -1;
  if (t >= durationS) return 0;
  const p = t / durationS;
  // easeOutBack
  const c1 = 1.4;
  const c3 = c1 + 1;
  const eased = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
  return eased - 1;
}

/** Window event the toaster scene fires once its model is on screen. */
export const TOASTER_READY_EVENT = 'toaster:ready';
/** Window event fired when the intro ends and the page becomes interactive. */
export const INTRO_DONE_EVENT = 'intro:done';
