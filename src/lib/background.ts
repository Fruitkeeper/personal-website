// Pure helpers for the full-page nebula background (scripts/background.ts).

export type RGB = [number, number, number];

/** Parses #rgb / #rrggbb into 0–1 floats for a shader uniform; `fallback` otherwise. */
export function parseHexColor(value: string, fallback: RGB): RGB {
  const hex = value.trim().replace(/^#/, '');
  const full =
    /^[0-9a-f]{3}$/i.test(hex) ? [...hex].map((c) => c + c).join('') : /^[0-9a-f]{6}$/i.test(hex) ? hex : null;
  if (!full) return fallback;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as RGB;
}

// ── Ripples ────────────────────────────────────────────────────────────────

export const MAX_RIPPLES = 4;
/** Seconds after which a ripple has fully faded and its slot can be reused. */
export const RIPPLE_LIFETIME = 3;

/** x, y in shader space (aspect-corrected, origin at center), start time, strength. */
export type Ripple = { x: number; y: number; start: number; strength: number };

/**
 * Adds a ripple, dropping expired ones; when all slots are live, the oldest is
 * replaced. Returns a new array, newest last.
 */
export function addRipple(ripples: readonly Ripple[], ripple: Ripple): Ripple[] {
  const live = ripples.filter((r) => ripple.start - r.start < RIPPLE_LIFETIME);
  return [...live, ripple].slice(-MAX_RIPPLES);
}

/** Flattens ripples into the vec4[MAX_RIPPLES] uniform; empty slots have strength 0. */
export function packRipples(ripples: readonly Ripple[]): Float32Array {
  const out = new Float32Array(MAX_RIPPLES * 4);
  ripples.slice(-MAX_RIPPLES).forEach((r, i) => out.set([r.x, r.y, r.start, r.strength], i * 4));
  return out;
}

/** Converts a CSS-pixel point to shader space: y up, origin at center, units of viewport height. */
export function toShaderSpace(clientX: number, clientY: number, width: number, height: number): [number, number] {
  if (!(height > 0)) return [0, 0];
  return [(clientX - width / 2) / height, (height / 2 - clientY) / height];
}

// ── Resolution & adaptive quality ──────────────────────────────────────────

/** Fraction of CSS pixels rendered. The nebula is soft, so it upscales invisibly. */
export const QUALITY_LEVELS = [0.5, 0.35, 0.25] as const;
/** Hard cap on rendered pixels, so huge monitors don't cost more than ~1080p/2. */
export const MAX_RENDER_PIXELS = 1_000_000;

export function renderSize(cssWidth: number, cssHeight: number, scale: number): [number, number] {
  if (!(cssWidth > 0 && cssHeight > 0 && scale > 0)) return [1, 1];
  let w = cssWidth * scale;
  let h = cssHeight * scale;
  const pixels = w * h;
  if (pixels > MAX_RENDER_PIXELS) {
    const shrink = Math.sqrt(MAX_RENDER_PIXELS / pixels);
    w *= shrink;
    h *= shrink;
  }
  return [Math.max(1, Math.round(w)), Math.max(1, Math.round(h))];
}

/** Average frame time (ms) above which quality steps down. ~40fps. */
export const SLOW_FRAME_MS = 25;

/** Next quality index given the recent average frame time. Only ever steps down. */
export function adaptQuality(level: number, avgFrameMs: number): number {
  const last = QUALITY_LEVELS.length - 1;
  return avgFrameMs > SLOW_FRAME_MS ? Math.min(level + 1, last) : level;
}
