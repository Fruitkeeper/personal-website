// Pure helpers for the widgets' bespoke visuals (src/components/widgets/*).

const BLOCKS = '▁▂▃▄▅▆▇█';

/**
 * A text sparkline: `values` downsampled to `width` buckets (bucket means),
 * each drawn as one of eight block characters. Flat series draw mid-height;
 * fewer than two points draw nothing.
 */
export function blockSpark(values: number[], width: number): string {
  const pts = values.filter(Number.isFinite);
  if (pts.length < 2 || !(width > 0)) return '';
  const n = Math.min(Math.floor(width), pts.length);
  const buckets: number[] = [];
  for (let i = 0; i < n; i++) {
    const from = Math.floor((i * pts.length) / n);
    const to = Math.max(from + 1, Math.floor(((i + 1) * pts.length) / n));
    const slice = pts.slice(from, to);
    buckets.push(slice.reduce((s, v) => s + v, 0) / slice.length);
  }
  const min = Math.min(...buckets);
  const max = Math.max(...buckets);
  return buckets
    .map((v) => BLOCKS[max === min ? 3 : Math.round(((v - min) / (max - min)) * (BLOCKS.length - 1))])
    .join('');
}

export type BoardSquare = { piece: string; white: boolean } | null;

/**
 * Board from a FEN, rank 8 first, without a chess engine (just reading the
 * placement field). Null if the placement isn't 8 ranks of 8 squares.
 */
export function fenBoard(fen: string): { squares: BoardSquare[][]; whiteToMove: boolean } | null {
  if (typeof fen !== 'string') return null;
  const [placement, turn] = fen.trim().split(/\s+/);
  const ranks = placement?.split('/') ?? [];
  if (ranks.length !== 8) return null;
  const squares: BoardSquare[][] = [];
  for (const rank of ranks) {
    const row: BoardSquare[] = [];
    for (const ch of rank) {
      if (/[1-8]/.test(ch)) for (let i = 0; i < Number(ch); i++) row.push(null);
      else if (/[prnbqkPRNBQK]/.test(ch)) row.push({ piece: ch.toLowerCase(), white: ch === ch.toUpperCase() });
      else return null;
    }
    if (row.length !== 8) return null;
    squares.push(row);
  }
  return { squares, whiteToMove: turn !== 'b' };
}

/**
 * 3D tilt (degrees) for a pointer at (px, py) within an element, each in
 * [0, 1] (0.5, 0.5 = center). The element leans toward the pointer.
 */
export function tilt(px: number, py: number, maxDeg = 10): { rx: number; ry: number } {
  const c = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.5);
  return { rx: (0.5 - c(py)) * 2 * maxDeg, ry: (c(px) - 0.5) * 2 * maxDeg };
}

// ── Seven-segment scoreboard digits ─────────────────────────────────────────

/** Lit segments per digit, standard a–g naming (a top, then clockwise, g middle). */
export const SEGMENTS: Record<number, string> = {
  0: 'abcdef',
  1: 'bc',
  2: 'abdeg',
  3: 'abcdg',
  4: 'bcfg',
  5: 'acdfg',
  6: 'acdefg',
  7: 'abc',
  8: 'abcdefg',
  9: 'abcdfg',
};

/**
 * `n` as `count` scoreboard digits, most significant first. Leading positions
 * are null (unlit), except a lone 0 shows as 0. Clamps to the max displayable.
 */
export function scoreDigits(n: number, count: number): (number | null)[] {
  const max = 10 ** count - 1;
  const v = Number.isFinite(n) ? Math.max(0, Math.min(max, Math.floor(n))) : 0;
  const s = String(v).padStart(count, ' ');
  return [...s].map((c) => (c === ' ' ? null : Number(c)));
}
