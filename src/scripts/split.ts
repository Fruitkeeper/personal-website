// Drives the split layout: writes scroll progress to `--split` on <html>,
// which the CSS turns into the panel/content slide. See src/lib/split.ts.
import { panelOpacity, splitProgress } from '../lib/split';

const root = document.documentElement;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let frame = 0;

function update() {
  frame = 0;
  // Reduced motion: no lateral slide. The panel stays put on the right.
  const progress = reducedMotion.matches
    ? 0
    : splitProgress(window.scrollY, window.innerHeight, root.scrollHeight - window.innerHeight);
  root.style.setProperty('--split', progress.toFixed(4));
  root.style.setProperty('--split-panel-opacity', panelOpacity(progress).toFixed(4));
}

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(update);
};

window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', schedule);
reducedMotion.addEventListener('change', schedule);
// Content height can change after load (fonts, images), which changes maxScroll.
new ResizeObserver(schedule).observe(document.body);
update();
