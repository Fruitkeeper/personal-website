// Puzzle logic for the Chess planet (scripts/chess.ts), on top of chess.js.
import { Chess, type Square } from 'chess.js';

export type Puzzle = {
  id: string;
  /** Position before the solver's first move. */
  fen: string;
  /** UCI moves alternating solver / opponent, starting with the solver. */
  solution: string[];
  rating: number;
  themes: string[];
  /** The opponent's move that led here (UCI), for highlighting. */
  lastMove: string | null;
};

const UCI = /^[a-h][1-8][a-h][1-8][qrbn]?$/;

/** Defensive parse of Lichess's /api/puzzle/daily. Null if anything essential is off. */
export function parsePuzzle(json: unknown): Puzzle | null {
  const p = (json as { puzzle?: Record<string, unknown> } | null)?.puzzle;
  if (!p || typeof p.id !== 'string' || typeof p.fen !== 'string') return null;
  const solution = Array.isArray(p.solution) ? p.solution.filter((m): m is string => typeof m === 'string' && UCI.test(m)) : [];
  if (!solution.length || solution.length !== (p.solution as unknown[]).length) return null;
  try {
    new Chess(p.fen);
  } catch {
    return null;
  }
  return {
    id: p.id,
    fen: p.fen,
    solution,
    rating: typeof p.rating === 'number' ? p.rating : 0,
    themes: Array.isArray(p.themes) ? p.themes.filter((t): t is string => typeof t === 'string') : [],
    lastMove: typeof p.lastMove === 'string' && UCI.test(p.lastMove) ? p.lastMove : null,
  };
}

export const toUci = (m: { from: string; to: string; promotion?: string }) => `${m.from}${m.to}${m.promotion ?? ''}`;

export function splitUci(uci: string): { from: Square; to: Square; promotion?: string } {
  return { from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square, promotion: uci[4] };
}

/**
 * Promotion piece for a from→to the solver chose: the solution's own piece if
 * the expected move matches the squares (so underpromotion puzzles work),
 * otherwise a queen.
 */
export function promotionFor(from: string, to: string, expected: string | undefined): string {
  return expected && expected.startsWith(from + to) && expected.length === 5 ? expected[4] : 'q';
}

export type MoveResult = 'correct' | 'solved' | 'wrong' | 'illegal';

/**
 * Judge the solver's move at solution index `ply` (always even) on `game`
 * (which must be at that point). Plays it on success. Any checkmate counts,
 * as on Lichess, even if it differs from the stored solution.
 */
export function tryMove(game: Chess, puzzle: Puzzle, ply: number, uci: string): MoveResult {
  const expected = puzzle.solution[ply];
  let move;
  try {
    move = game.move(splitUci(uci));
  } catch {
    return 'illegal';
  }
  const isMate = game.isCheckmate();
  if (toUci(move) !== expected && !isMate) {
    game.undo();
    return 'wrong';
  }
  return isMate || ply + 1 >= puzzle.solution.length ? 'solved' : 'correct';
}

/** Play the opponent's scripted reply after a correct move. Returns its UCI, or null if none. */
export function playReply(game: Chess, puzzle: Puzzle, ply: number): string | null {
  const reply = puzzle.solution[ply + 1];
  if (!reply) return null;
  game.move(splitUci(reply));
  return reply;
}

/** Lichess themes are camelCase ("trappedPiece"); make them readable. */
export function prettyTheme(theme: string): string {
  return theme.replace(/([a-z])([A-Z0-9])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}
