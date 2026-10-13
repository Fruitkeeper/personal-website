// Drives the project solar system: each planet on its own orbit, outer ones
// slower; motion eases to a stop while the visitor hovers/focuses a planet or
// has a project open; opens project dialogs. Pure math in src/lib/orbit.ts.
import { orbitPeriod, placeOnOrbit, planetAngle, planetOrbits, type Radii } from '../lib/orbit';

/** Room kept clear on the right for the contact dock (Contact.astro). */
const DOCK_RESERVE: Radii = { x: 72, y: 0 };

export function mountOrbit() {
  const items = [...document.querySelectorAll<HTMLElement>('[data-orbit-item]')];
  if (!items.length) return;
  const rings = [...document.querySelectorAll<SVGEllipseElement>('[data-orbit-rings] ellipse')];

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let time = 0; // seconds of motion so far; only advances while moving
  let speed = 1; // 0 = stopped, 1 = full speed; eased toward the target
  let orbits: Radii[] = [];
  let periods: number[] = [];
  let hovered = 0;
  let lastTick = 0;
  let frame = 0;

  const measure = () => {
    const item = {
      x: Math.max(...items.map((el) => el.offsetWidth)),
      y: Math.max(...items.map((el) => el.offsetHeight)),
    };
    orbits = planetOrbits(items.length, window.innerWidth, window.innerHeight, item, DOCK_RESERVE);
    periods = orbits.map((o) => orbitPeriod((o.x + o.y) / 2, (orbits[0].x + orbits[0].y) / 2));
    rings.forEach((ring, i) => {
      ring.setAttribute('rx', String(orbits[i]?.x ?? 0));
      ring.setAttribute('ry', String(orbits[i]?.y ?? 0));
    });
  };

  const layout = () => {
    items.forEach((el, i) => {
      const p = placeOnOrbit(planetAngle(i, time, periods[i]), orbits[i]);
      el.style.transform = `translate(-50%, -50%) translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
    });
  };

  const anyDialogOpen = () => document.querySelector('dialog[open]') !== null;
  const shouldMove = () => hovered === 0 && !anyDialogOpen() && !items.some((el) => el.contains(document.activeElement));

  const loop = (now: number) => {
    const dt = Math.min((now - lastTick) / 1000, 0.1);
    lastTick = now;
    speed += ((shouldMove() ? 1 : 0) - speed) * Math.min(1, dt * 4);
    // Easing alone only approaches 0; snap so a hovered planet truly holds still.
    if (speed < 0.01 && !shouldMove()) speed = 0;
    time += dt * speed;
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

  // Hover/focus stops the system so the planet is easy to click.
  for (const el of items) {
    el.addEventListener('pointerenter', () => hovered++);
    el.addEventListener('pointerleave', () => (hovered = Math.max(0, hovered - 1)));
  }

  // Project dialogs: open from the planet; close on backdrop click (Esc and the × are native).
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
