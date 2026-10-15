// Moves the hero's moons around the toaster (Moons.astro); hover/focus or an
// open panel eases the orbit to a stop. Math in src/lib/orbit.ts.
import { INNER_PERIOD, OUTER_PERIOD, moonAngle, placeOnOrbit, ringRadii, type Radii } from '../lib/orbit';

const PERIODS = [INNER_PERIOD, OUTER_PERIOD];
const OFFSETS = [0.4, 1.3];

export function mountOrbit() {
  const stage = document.querySelector<HTMLElement>('[data-orbit]');
  if (!stage) return;
  const moons = [...stage.querySelectorAll<HTMLElement>('[data-moon]')];
  const ringEls = [...stage.querySelectorAll<SVGEllipseElement>('ellipse[data-ring]')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let radii: Radii[] = [];
  let time = 0;
  let speed = 1;
  let hovered = 0;
  let last = 0;
  let frame = 0;

  const measure = () => {
    const size = Math.max(...moons.map((m) => m.offsetWidth), 0);
    const { inner, outer } = ringRadii(stage.clientWidth, stage.clientHeight, size);
    radii = [inner, outer];
    ringEls.forEach((el, r) => {
      el.setAttribute('rx', String(radii[r].x));
      el.setAttribute('ry', String(radii[r].y));
    });
  };
  const layout = () => {
    for (const m of moons) {
      const r = Number(m.dataset.ring);
      const a = moonAngle(Number(m.dataset.index), Number(m.dataset.count), time, PERIODS[r], OFFSETS[r]);
      const p = placeOnOrbit(a, radii[r]);
      m.style.transform = `translate(-50%, -50%) translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
    }
  };
  const moving = () => hovered === 0 && !document.querySelector('dialog[open]') && !moons.includes(document.activeElement as HTMLElement);
  const loop = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    speed += ((moving() ? 1 : 0) - speed) * Math.min(1, dt * 4);
    if (speed < 0.01 && !moving()) speed = 0;
    time += dt * speed;
    layout();
    frame = requestAnimationFrame(loop);
  };
  const start = () => {
    if (frame || reducedMotion.matches || document.hidden) return;
    last = performance.now();
    frame = requestAnimationFrame(loop);
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };

  for (const m of moons) {
    m.addEventListener('pointerenter', () => hovered++);
    m.addEventListener('pointerleave', () => (hovered = Math.max(0, hovered - 1)));
  }
  new ResizeObserver(() => {
    measure();
    layout();
  }).observe(stage);
  // Pause while the hero is scrolled away or the tab is hidden.
  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(stage);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  measure();
  layout();
  start();
}
