import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { parsePuzzle, playReply, prettyTheme, promotionFor, tryMove, type Puzzle } from '../src/lib/chess-puzzle';

// The real daily puzzle shape from lichess.org/api/puzzle/daily.
const daily = {
  game: { id: 'x', pgn: 'd4 d5' },
  puzzle: {
    id: 'GGj1G',
    fen: '1r1qkb1r/p1p3pp/2n1pp2/3p1b2/QnPP4/P1N1PN2/1P3PPP/R1B1KB1R b KQk - 0 1',
    solution: ['f5c2', 'a3b4', 'c2a4'],
    rating: 1974,
    themes: ['opening', 'trappedPiece'],
    lastMove: 'a2a3',
  },
};

// White to move, back-rank mate in one with two mates: Ra8# (stored) and Rd8#.
const mateInOne: Puzzle = {
  id: 'm1',
  fen: '6k1/5ppp/8/8/8/8/5PPP/R2R2K1 w - - 0 1',
  solution: ['a1a8'],
  rating: 800,
  themes: ['mateIn1'],
  lastMove: null,
};

describe('parsePuzzle', () => {
  it('parses the daily puzzle', () => {
    const p = parsePuzzle(daily)!;
    expect(p).toMatchObject({ id: 'GGj1G', solution: ['f5c2', 'a3b4', 'c2a4'], rating: 1974, lastMove: 'a2a3' });
  });
  it.each([null, {}, { puzzle: {} }, { puzzle: { ...daily.puzzle, fen: 'not a fen' } }, { puzzle: { ...daily.puzzle, solution: [] } }, { puzzle: { ...daily.puzzle, solution: ['f5c2', 'bogus'] } }])(
    'rejects malformed input %#',
    (v) => expect(parsePuzzle(v)).toBeNull(),
  );
  it('tolerates missing optional fields', () => {
    const { rating, themes, lastMove, ...rest } = daily.puzzle;
    expect(parsePuzzle({ puzzle: rest })).toMatchObject({ rating: 0, themes: [], lastMove: null });
  });
});

describe('tryMove / playReply', () => {
  const puzzle = parsePuzzle(daily)!;

  it('accepts the solution move and plays the scripted reply', () => {
    const g = new Chess(puzzle.fen);
    expect(tryMove(g, puzzle, 0, 'f5c2')).toBe('correct');
    expect(playReply(g, puzzle, 0)).toBe('a3b4');
    expect(tryMove(g, puzzle, 2, 'c2a4')).toBe('solved');
  });
  it('rejects a legal but wrong move and leaves the position unchanged', () => {
    const g = new Chess(puzzle.fen);
    const before = g.fen();
    expect(tryMove(g, puzzle, 0, 'f5g4')).toBe('wrong');
    expect(g.fen()).toBe(before);
  });
  it('reports illegal moves without changing the position', () => {
    const g = new Chess(puzzle.fen);
    const before = g.fen();
    expect(tryMove(g, puzzle, 0, 'a1a8')).toBe('illegal');
    expect(g.fen()).toBe(before);
  });
  it('has no reply after the last move', () => {
    const g = new Chess(puzzle.fen);
    expect(playReply(g, puzzle, 2)).toBeNull();
  });
  it('accepts the stored mate', () => {
    expect(tryMove(new Chess(mateInOne.fen), mateInOne, 0, 'a1a8')).toBe('solved');
  });
  it('accepts a different checkmate too, like Lichess', () => {
    expect(tryMove(new Chess(mateInOne.fen), mateInOne, 0, 'd1d8')).toBe('solved');
  });
  it('still rejects a non-mating alternative', () => {
    expect(tryMove(new Chess(mateInOne.fen), mateInOne, 0, 'a1a7')).toBe('wrong');
  });
});

describe('promotionFor', () => {
  it('uses the solution piece for underpromotion', () => expect(promotionFor('e7', 'e8', 'e7e8n')).toBe('n'));
  it('defaults to a queen', () => {
    expect(promotionFor('e7', 'e8', 'd2d4')).toBe('q');
    expect(promotionFor('e7', 'e8', undefined)).toBe('q');
  });
});

describe('prettyTheme', () => {
  it.each([
    ['trappedPiece', 'Trapped Piece'],
    ['mateIn1', 'Mate In 1'],
    ['opening', 'Opening'],
  ])('%s → %s', (input, out) => expect(prettyTheme(input)).toBe(out));
});
