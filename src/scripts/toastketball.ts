// Toast-ketball: a canvas mini-game in the basketball widget's panel.
// Physics in src/lib/toastketball.ts; this file handles input, drawing and score.
import {
  AIM_ANGLE,
  AIM_SPEED,
  FLOOR_Y,
  START,
  TOASTER,
  TOAST_R,
  WORLD_H,
  WORLD_W,
  aimVelocity,
  flickVelocity,
  launch,
  nextToasterX,
  step,
  type Sample,
  type Shot,
} from '../lib/toastketball';
import { HOP_EVENT } from '../lib/toaster';
import { setSevenSeg } from './sevenseg';

const BEST_KEY = 'toastketball:best';
const RESET_DELAY_MS = 700;
const GRAB_RADIUS = 34; // world units: how close to the toast a drag must start
const CALLS = {
  swish: ['Swish! 🔥', 'Nothing but slot.', 'Golden brown.'],
  make: ['Bucket.', 'Off the rim and in!', 'Toasted.'],
  miss: ['Brick.', 'Crumbs.', 'The toaster sighs.', 'Air toast.'],
};
const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];

function readBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}
function writeBest(n: number) {
  try {
    localStorage.setItem(BEST_KEY, String(n));
  } catch {
    /* storage unavailable: best streak just won't persist */
  }
}

export function mountToastketball() {
  const root = document.querySelector<HTMLElement>('[data-toastketball]');
  const canvas = root?.querySelector('canvas');
  const dialog = root?.closest('dialog');
  if (!root || !canvas || !dialog) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const stat = (name: string) => root.querySelector<HTMLElement>(`[data-stat="${name}"]`)!;
  const call = root.querySelector<HTMLElement>('[data-call]')!;
  const stats = { makes: 0, shots: 0, streak: 0, best: readBest() };
  const renderStats = () => {
    for (const [k, v] of Object.entries(stats)) stat(k).textContent = String(v);
    // The small widget shows the best streak too.
    for (const el of document.querySelectorAll('[data-best-streak]')) el.textContent = String(stats.best);
    for (const el of document.querySelectorAll<HTMLElement>('[data-sevenseg]')) setSevenSeg(el, stats.best);
  };
  renderStats();

  let toasterX = 290;
  let shot: Shot | null = null;
  const aim = { angle: 55, speed: 620 };
  let showAim = false;
  let dragging: { samples: Sample[] } | null = null;
  let resetAt = 0;
  let frame = 0;
  let last = 0;

  // ── Coordinates ──────────────────────────────────────────────────────────
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
  };
  const toWorld = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * WORLD_W, y: ((e.clientY - rect.top) / rect.height) * WORLD_H };
  };

  // ── Drawing ──────────────────────────────────────────────────────────────
  const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  };

  const drawToaster = () => {
    const { halfWidth, top, bottom, slotHalf } = TOASTER;
    ctx.fillStyle = '#9fcbe8';
    roundRect(toasterX - halfWidth, top - 4, halfWidth * 2, bottom - top + 4, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    roundRect(toasterX - halfWidth + 5, top + 2, 6, bottom - top - 12, 3);
    ctx.fill();
    // Slot
    ctx.fillStyle = '#1c2533';
    roundRect(toasterX - slotHalf, top - 4, slotHalf * 2, 9, 3);
    ctx.fill();
    // Sad eyes + lever
    ctx.fillStyle = '#e8f4fb';
    roundRect(toasterX - 18, top + 30, 36, 16, 6);
    ctx.fill();
    ctx.fillStyle = '#1c2533';
    for (const dx of [-8, 8]) {
      ctx.beginPath();
      ctx.arc(toasterX + dx, top + 38, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#3a4352';
    roundRect(toasterX + halfWidth - 2, top + 22, 9, 6, 2);
    ctx.fill();
  };

  const drawToast = (x: number, y: number, spin: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(spin);
    const s = TOAST_R * 1.25;
    ctx.fillStyle = '#7a4a22';
    roundRect(-s, -s, s * 2, s * 2, 5);
    ctx.fill();
    ctx.fillStyle = '#d9a35f';
    roundRect(-s + 2.5, -s + 2.5, s * 2 - 5, s * 2 - 5, 3.5);
    ctx.fill();
    ctx.restore();
  };

  const drawAim = () => {
    // Dotted preview of the keyboard aim (the first stretch of the arc).
    let preview = launch(aimVelocity(aim.angle, aim.speed));
    ctx.fillStyle = 'rgba(251,146,60,0.75)';
    for (let i = 0; i < 14 && preview.outcome === 'flying'; i++) {
      preview = step(preview, 0.035, toasterX);
      ctx.beginPath();
      ctx.arc(preview.pos.x, preview.pos.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const draw = () => {
    const sx = canvas.width / WORLD_W;
    const sy = canvas.height / WORLD_H;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(sx, 0, 0, sy, 0, 0);

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, FLOOR_Y);
    ctx.lineTo(WORLD_W, FLOOR_Y);
    ctx.stroke();

    drawToaster();
    if (showAim && !shot) drawAim();
    if (shot) {
      if (shot.outcome !== 'make') drawToast(shot.pos.x, shot.pos.y, shot.time * 8);
    } else {
      drawToast(START.x, START.y, 0);
    }
  };

  // ── Game flow ────────────────────────────────────────────────────────────
  const shoot = (vel: { x: number; y: number }) => {
    if (shot) return;
    shot = launch(vel);
    stats.shots++;
    showAim = false;
    renderStats();
  };

  const finish = (s: Shot) => {
    if (s.outcome === 'make') {
      stats.makes++;
      stats.streak++;
      if (stats.streak > stats.best) {
        stats.best = stats.streak;
        writeBest(stats.best);
      }
      call.textContent = pick(s.touchedRim ? CALLS.make : CALLS.swish);
      window.dispatchEvent(new CustomEvent(HOP_EVENT));
      toasterX = nextToasterX(toasterX, Math.random);
    } else {
      stats.streak = 0;
      call.textContent = pick(CALLS.miss);
    }
    renderStats();
    resetAt = performance.now() + RESET_DELAY_MS;
  };

  const loop = (now: number) => {
    const dt = Math.min((now - last) / 1000, 1 / 20);
    last = now;
    if (shot?.outcome === 'flying') {
      shot = step(shot, dt, toasterX);
      if (shot.outcome !== 'flying') finish(shot);
    } else if (shot && now >= resetAt) {
      shot = null;
    }
    draw();
    frame = requestAnimationFrame(loop);
  };
  const start = () => {
    if (frame) return;
    resize();
    last = performance.now();
    frame = requestAnimationFrame(loop);
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };

  // Only run while the dialog is open.
  new MutationObserver(() => (dialog.open ? start() : stop())).observe(dialog, { attributes: true, attributeFilter: ['open'] });
  window.addEventListener('resize', () => dialog.open && resize());

  // ── Pointer: drag the toast and flick ────────────────────────────────────
  canvas.addEventListener('pointerdown', (e) => {
    if (shot) return;
    const p = toWorld(e);
    if (Math.hypot(p.x - START.x, p.y - START.y) > GRAB_RADIUS) return;
    try {
      // Keeps the drag alive if the pointer leaves the canvas; can throw for
      // a pointer the browser no longer tracks, which shouldn't block a throw.
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    dragging = { samples: [{ ...p, t: e.timeStamp }] };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    dragging.samples.push({ ...toWorld(e), t: e.timeStamp });
    if (dragging.samples.length > 20) dragging.samples.shift();
  });
  const release = (e: PointerEvent) => {
    if (!dragging) return;
    dragging.samples.push({ ...toWorld(e), t: e.timeStamp });
    const vel = flickVelocity(dragging.samples);
    dragging = null;
    if (vel) shoot(vel);
    else call.textContent = 'Flick it — quick drag and let go.';
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', () => (dragging = null));

  // ── Keyboard: aim and shoot ──────────────────────────────────────────────
  canvas.addEventListener('keydown', (e) => {
    const clamp = (v: number, [lo, hi]: [number, number]) => Math.max(lo, Math.min(hi, v));
    const handled = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' '].includes(e.key);
    if (!handled) return;
    e.preventDefault();
    showAim = true;
    if (e.key === 'ArrowLeft') aim.angle = clamp(aim.angle + 2, AIM_ANGLE);
    if (e.key === 'ArrowRight') aim.angle = clamp(aim.angle - 2, AIM_ANGLE);
    if (e.key === 'ArrowUp') aim.speed = clamp(aim.speed + 15, AIM_SPEED);
    if (e.key === 'ArrowDown') aim.speed = clamp(aim.speed - 15, AIM_SPEED);
    if (e.key === 'Enter' || e.key === ' ') shoot(aimVelocity(aim.angle, aim.speed));
  });
}
