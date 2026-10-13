// Full-page nebula background: one full-screen quad, raw WebGL (no Three.js),
// so it starts immediately. Pure logic lives in src/lib/background.ts.
import {
  QUALITY_LEVELS,
  addRipple,
  adaptQuality,
  packRipples,
  parseHexColor,
  renderSize,
  toShaderSpace,
  type RGB,
  type Ripple,
} from '../lib/background';
import { nebulaFragment, nebulaVertex } from './shaders/nebula';

const UNIFORMS = [
  'uResolution', 'uTime', 'uPointer', 'uPointerVel', 'uPointerOn', 'uScroll',
  'uEnergy', 'uColorA', 'uColorB', 'uColorC', 'uRipples',
] as const;
type UniformName = (typeof UNIFORMS)[number];

const FALLBACK_COLORS: [RGB, RGB, RGB] = [
  [0.486, 0.361, 1],
  [0.133, 0.827, 0.933],
  [0.957, 0.447, 0.714],
];
/** Frames averaged before deciding whether to drop quality. */
const QUALITY_SAMPLE_FRAMES = 90;
const CLICK_RIPPLE_STRENGTH = 1;
const SWAP_RIPPLE_STRENGTH = 1.8;
const POINTER_VELOCITY_SCALE = 0.05;

function compile(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`Shader compile failed: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}

/** Builds program + quad; called on start and again after a context restore. */
function setupGL(gl: WebGLRenderingContext) {
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, nebulaVertex));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, nebulaFragment));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Program link failed: ${gl.getProgramInfoLog(program)}`);
  }
  gl.useProgram(program);

  // One triangle that covers the whole screen.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const loc = {} as Record<UniformName, WebGLUniformLocation | null>;
  for (const name of UNIFORMS) loc[name] = gl.getUniformLocation(program, name);
  return loc;
}

/** Page palette: the visual panel sets per-page accents; fall back to :root. */
function readPalette(): [RGB, RGB, RGB] {
  const source = document.querySelector('[data-visual-panel]') ?? document.documentElement;
  const style = getComputedStyle(source);
  return [1, 2, 3].map((i, idx) =>
    parseHexColor(style.getPropertyValue(`--accent-${i}`), FALLBACK_COLORS[idx]),
  ) as [RGB, RGB, RGB];
}

export function mountBackground(canvas: HTMLCanvasElement): void {
  const gl = canvas.getContext('webgl', { antialias: false, depth: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return; // CSS background stays.

  let loc: ReturnType<typeof setupGL>;
  try {
    loc = setupGL(gl);
  } catch (err) {
    console.warn('Background shader failed; using CSS background.', err);
    return;
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const palette = readPalette();

  // ── State ────────────────────────────────────────────────────────────────
  let quality = 0;
  let elapsed = 0;
  let lastTick = 0;
  let frame = 0;
  let contextLost = false;
  let ripples: Ripple[] = [];
  let frameSamples = 0;
  let frameTotal = 0;

  const pointer = { x: 0, y: 0, vx: 0, vy: 0, on: 0, targetOn: 0 };
  const pointerTarget = { x: 0, y: 0 };
  let lastScrollY = window.scrollY;
  let energy = 0;

  const resize = () => {
    const [w, h] = renderSize(window.innerWidth, window.innerHeight, QUALITY_LEVELS[quality]);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
  };

  const draw = () => {
    if (contextLost) return;
    gl.uniform2f(loc.uResolution, canvas.width, canvas.height);
    gl.uniform1f(loc.uTime, elapsed);
    gl.uniform2f(loc.uPointer, pointer.x, pointer.y);
    gl.uniform2f(loc.uPointerVel, pointer.vx, pointer.vy);
    gl.uniform1f(loc.uPointerOn, pointer.on);
    gl.uniform1f(loc.uScroll, window.scrollY / Math.max(window.innerHeight, 1));
    gl.uniform1f(loc.uEnergy, energy);
    gl.uniform3fv(loc.uColorA, palette[0]);
    gl.uniform3fv(loc.uColorB, palette[1]);
    gl.uniform3fv(loc.uColorC, palette[2]);
    gl.uniform4fv(loc.uRipples, packRipples(ripples));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const step = (dt: number) => {
    // Eased pointer: position follows the cursor, velocity is the per-frame delta.
    const ease = 1 - Math.pow(0.001, dt); // frame-rate independent smoothing
    const safeDt = Math.max(dt, 1e-3);
    const nx = pointer.x + (pointerTarget.x - pointer.x) * ease;
    const ny = pointer.y + (pointerTarget.y - pointer.y) * ease;
    // Velocity in viewport-heights/second, scaled down and smoothed.
    pointer.vx += (((nx - pointer.x) / safeDt) * POINTER_VELOCITY_SCALE - pointer.vx) * ease;
    pointer.vy += (((ny - pointer.y) / safeDt) * POINTER_VELOCITY_SCALE - pointer.vy) * ease;
    pointer.x = nx;
    pointer.y = ny;
    pointer.on += (pointer.targetOn - pointer.on) * ease * 0.5;

    // Scroll speed (viewport heights / second) feeds energy, which decays.
    const scrollDelta = Math.abs(window.scrollY - lastScrollY) / Math.max(window.innerHeight, 1);
    lastScrollY = window.scrollY;
    energy = Math.min(1, energy * Math.pow(0.25, dt) + scrollDelta * 1.5);
  };

  const loop = (now: number) => {
    const dt = Math.min((now - lastTick) / 1000, 0.1); // clamp: no jumps after a stall
    lastTick = now;
    elapsed += dt;
    step(dt);
    draw();

    // Adaptive quality: if the GPU is struggling, render fewer pixels.
    frameTotal += dt * 1000;
    if (++frameSamples === QUALITY_SAMPLE_FRAMES) {
      const next = adaptQuality(quality, frameTotal / frameSamples);
      if (next !== quality) {
        quality = next;
        resize();
      }
      frameSamples = 0;
      frameTotal = 0;
    }
    frame = requestAnimationFrame(loop);
  };

  const start = () => {
    if (frame || contextLost || document.hidden || reducedMotion.matches) return;
    lastTick = performance.now();
    frame = requestAnimationFrame(loop);
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
  };
  /** Reduced motion gets one still frame, redrawn only when something changes. */
  const redrawStill = () => {
    if (reducedMotion.matches) draw();
  };

  // ── Input ────────────────────────────────────────────────────────────────
  window.addEventListener(
    'pointermove',
    (e) => {
      [pointerTarget.x, pointerTarget.y] = toShaderSpace(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
      pointer.targetOn = 1;
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => (pointer.targetOn = 0));

  const ripple = (clientX: number, clientY: number, strength: number) => {
    if (reducedMotion.matches) return;
    const [x, y] = toShaderSpace(clientX, clientY, window.innerWidth, window.innerHeight);
    ripples = addRipple(ripples, { x, y, start: elapsed, strength });
  };
  window.addEventListener('pointerdown', (e) => ripple(e.clientX, e.clientY, CLICK_RIPPLE_STRENGTH), { passive: true });

  // Panel swap (scripts/split.ts sets data-split-swap): shockwave where the panel lands.
  new MutationObserver(() => {
    const panel = document.querySelector('[data-visual-panel]');
    if (!panel) return;
    const landsLeft = document.documentElement.dataset.splitSwap === 'end';
    const width = window.innerWidth;
    ripple(landsLeft ? width * 0.2 : width * 0.8, window.innerHeight / 2, SWAP_RIPPLE_STRENGTH);
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-split-swap'] });

  // ── Lifecycle ────────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    resize();
    redrawStill();
  });
  window.addEventListener('scroll', redrawStill, { passive: true });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reducedMotion.addEventListener('change', () => {
    stop();
    reducedMotion.matches ? draw() : start();
  });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault(); // allows the browser to restore it
    contextLost = true;
    stop();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    try {
      loc = setupGL(gl);
    } catch {
      return;
    }
    contextLost = false;
    resize();
    reducedMotion.matches ? draw() : start();
  });

  resize();
  draw();
  canvas.dataset.ready = 'true';
  start();
}
