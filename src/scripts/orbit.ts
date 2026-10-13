// Drives the project orbit: positions items on a flat ring around the toaster,
// eases to a stop while the visitor hovers/focuses an item or has a project
// open, and opens project dialogs. Pure math lives in src/lib/orbit.ts.
import { advanceRotation, itemAngle, orbitRadii, placeOnRing } from '../lib/orbit';

/** Start with items off the vertical axis, so none sits dead center on the toaster. */
const INITIAL_ROTATION = Math.PI / 4;

export function mountOrbit() {
  const items = [...document.querySelectorAll<HTMLElement>('[data-orbit-item]')];
  if (!items.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let rotation = INITIAL_ROTATION;
  let speed = 1; // 0 = stopped, 1 = full speed; eased toward the target
  let radii = { x: 0, y: 0 };
  let hovered = 0;
  let lastTick = 0;
  let frame = 0;

  const measure = () => {
    const itemWidth = Math.max(...items.map((el) => el.offsetWidth));
    const itemHeight = Math.max(...items.map((el) => el.offsetHeight));
    // The ring is centered on the viewport, like the toaster.
    radii = orbitRadii(window.innerWidth, window.innerHeight, itemWidth, itemHeight);
  };

  const layout = () => {
    items.forEach((el, i) => {
      const p = placeOnRing(itemAngle(i, items.length, rotation), radii.x, radii.y);
      el.style.transform = `translate(-50%, -50%) translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
    });
  };

  const anyDialogOpen = () => document.querySelector('dialog[open]') !== null;
  const shouldMove = () => hovered === 0 && !anyDialogOpen() && !items.some((el) => el.contains(document.activeElement));

  const loop = (now: number) => {
    const dt = Math.min((now - lastTick) / 1000, 0.1);
    lastTick = now;
    speed += ((shouldMove() ? 1 : 0) - speed) * Math.min(1, dt * 4);
    // Easing alone only approaches 0; snap so a hovered chip truly holds still.
    if (speed < 0.01 && !shouldMove()) speed = 0;
    rotation = advanceRotation(rotation, dt * speed);
    layout();
    frame = requestAnimationFrame(loop);
  };
  const start = () => {
    if (frame || reducedMotion.matches || document.hidden) return;
    lastTick = performance.now();
    frame = requestAnimationFrame(loop);
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };

  // Hover/focus slows the orbit to a stop so the item is easy to click.
  for (const el of items) {
    el.addEventListener('pointerenter', () => hovered++);
    el.addEventListener('pointerleave', () => (hovered = Math.max(0, hovered - 1)));
  }

  // Project dialogs: open from the chip; close on backdrop click (Esc and the × are native).
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-open-dialog]')) {
    const dialog = document.getElementById(button.dataset.openDialog!) as HTMLDialogElement | null;
    if (!dialog) continue;
    button.addEventListener('click', () => dialog.showModal());
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  }

  window.addEventListener('resize', () => {
    measure();
    layout();
  });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reducedMotion.addEventListener('change', () => {
    stop();
    layout();
    start();
  });

  measure();
  layout();
  start();
}
