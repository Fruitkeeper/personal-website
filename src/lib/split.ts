// Scroll → layout state for the split layout, kept pure for unit testing.
//
// The layout is always in exactly one of two states — never in between — so
// the reader can't park it half-swapped. Crossing a threshold plays a fixed
// CSS transition from one state to the other.

/** `start`: visual panel on the right. `end`: visual panel on the left. */
export type SplitState = 'start' | 'end';

/** Scrolling past this fraction of the viewport height swaps to `end`… */
export const ENTER_RATIO = 0.3;
/** …and scrolling back above this one swaps back to `start`. The gap between
 *  the two (hysteresis) stops it flickering when parked near a threshold. */
export const EXIT_RATIO = 0.1;

/**
 * Pages that can scroll less than this fraction of the viewport never swap:
 * the reader couldn't scroll far enough to see the content after the swap.
 */
export const MIN_SCROLLABLE_RATIO = 0.4;

export function nextSplitState(
  current: SplitState,
  scrollY: number,
  viewportHeight: number,
  maxScroll: number,
): SplitState {
  if (!(viewportHeight > 0) || maxScroll < viewportHeight * MIN_SCROLLABLE_RATIO) return 'start';
  if (current === 'start' && scrollY > viewportHeight * ENTER_RATIO) return 'end';
  if (current === 'end' && scrollY < viewportHeight * EXIT_RATIO) return 'start';
  return current;
}
