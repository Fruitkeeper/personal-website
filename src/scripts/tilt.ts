// 3D tilt + glare for the widgets: each leans toward the cursor while hovered.
// Fine pointers only; skipped under reduced motion. Math in src/lib/widget-art.ts.
import { tilt } from '../lib/widget-art';

const MAX_DEG = 9;

export function mountTilt() {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  for (const el of document.querySelectorAll<HTMLElement>('[data-tilt]')) {
    let frame = 0;
    el.addEventListener('pointermove', (e) => {
      if (!finePointer.matches || reducedMotion.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const { rx, ry } = tilt(px, py, MAX_DEG);
        el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
        el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
        el.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
        el.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      });
    });
    el.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      for (const p of ['--rx', '--ry', '--gx', '--gy']) el.style.removeProperty(p);
    });
  }
}
