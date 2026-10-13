// Per-page palettes for the visual panel's 3D scene.

export type Palette = readonly [string, string, string];

export const palettes = {
  home: ['#7c5cff', '#22d3ee', '#f472b6'],
  projects: ['#f472b6', '#fb923c', '#facc15'],
  writing: ['#34d399', '#3b82f6', '#22d3ee'],
  about: ['#a78bfa', '#f472b6', '#fb7185'],
} as const satisfies Record<string, Palette>;

export type Visual = keyof typeof palettes;

/** Inline style that hands the palette to the scene via CSS custom properties. */
export function paletteStyle(visual: Visual): string {
  const [a, b, c] = palettes[visual];
  return `--accent-1: ${a}; --accent-2: ${b}; --accent-3: ${c};`;
}

/** Spline scene shown in the visual panel: a robot that tracks the cursor. */
export const SPLINE_SCENE_URL = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';
