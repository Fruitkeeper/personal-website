// Drives the split layout: sets `data-split="start" | "end"` on <html>; the CSS
// in Base.astro animates between the two. See src/lib/split.ts for the rules.
import { nextSplitState, type SplitState } from '../lib/split';

const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let state: SplitState = 'start';
let frame = 0;

function update() {
  frame = 0;
  // Reduced motion: no lateral slide. The panel stays put on the right.
  state = reducedMotion.matches
    ? 'start'
    : nextSplitState(state, window.scrollY, window.innerHeight, root.scrollHeight - window.innerHeight);
  if (root.dataset.split === state) return;
  root.dataset.split = state;
  // Marks a real swap (not the initial state), which plays the panel's opacity dip.
  if ('splitAnimate' in root.dataset) root.dataset.splitSwap = state;
}

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(update);
};

window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', schedule);
reducedMotion.addEventListener('change', schedule);
// Content height can change after load (fonts, images), which changes maxScroll.
new ResizeObserver(schedule).observe(document.body);

// Apply the initial state (e.g. a reload restored a scrolled position) without
// animating, then enable transitions from the next frame on.
update();
requestAnimationFrame(() => requestAnimationFrame(() => (root.dataset.splitAnimate = '')));
