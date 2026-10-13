// Scroll → position math for the split layout, kept pure for unit testing.
// Progress 0 = visual panel on the right; 1 = visual panel on the left.

/** Fraction of the viewport height the reader scrolls to complete the slide. */
export const SLIDE_DISTANCE_RATIO = 0.8;

/**
 * Pages that can scroll less than this fraction of the viewport don't slide
 * at all; otherwise the swap would snap across in a few pixels of scroll.
 */
export const MIN_SCROLLABLE_RATIO = 0.4;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function splitProgress(scrollY: number, viewportHeight: number, maxScroll: number): number {
  if (!(viewportHeight > 0) || maxScroll < viewportHeight * MIN_SCROLLABLE_RATIO) return 0;
  const distance = Math.min(viewportHeight * SLIDE_DISTANCE_RATIO, maxScroll);
  const t = clamp01(scrollY / distance);
  return t * t * (3 - 2 * t); // smoothstep: eases in and out of the slide
}

/** Panel fades a little mid-slide, while it passes behind the text. */
export function panelOpacity(progress: number): number {
  return 1 - 0.55 * Math.sin(Math.PI * clamp01(progress));
}
