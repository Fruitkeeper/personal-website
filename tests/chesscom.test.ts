import { describe, expect, it } from 'vitest';
import { CHESSCOM_USERNAME, formatChessComStats, statsUrl } from '../src/lib/chesscom';

// Trimmed real shape of api.chess.com/pub/player/{user}/stats.
const stats = {
  chess_rapid: { last: { rating: 1520, date: 1, rd: 50 }, best: { rating: 1600 } },
  chess_blitz: { last: { rating: 1410, date: 1, rd: 60 } },
  chess_bullet: { last: { rating: 1302.4, date: 1, rd: 70 } },
  tactics: { highest: { rating: 2105, date: 1 }, lowest: { rating: 400, date: 1 } },
  fide: 0,
};

describe('formatChessComStats', () => {
  it('lists rapid, blitz, bullet and best puzzle rating, in that order', () => {
    expect(formatChessComStats(stats)).toBe('My chess.com ratings: rapid 1520 · blitz 1410 · bullet 1302 · puzzles 2105');
  });
  it('skips modes the account has never played', () => {
    expect(formatChessComStats({ chess_blitz: { last: { rating: 1410 } } })).toBe('My chess.com ratings: blitz 1410');
  });
  it('ignores non-numeric, zero and non-finite ratings', () => {
    expect(
      formatChessComStats({
        chess_rapid: { last: { rating: '1500' } },
        chess_blitz: { last: { rating: 0 } },
        chess_bullet: { last: { rating: Number.NaN } },
        tactics: { highest: { rating: 1800 } },
      }),
    ).toBe('My chess.com ratings: puzzles 1800');
  });
  it('returns null for an unrated account or an unexpected payload', () => {
    expect(formatChessComStats({})).toBeNull();
    expect(formatChessComStats({ fide: 0 })).toBeNull();
    expect(formatChessComStats(null)).toBeNull();
    expect(formatChessComStats('nope')).toBeNull();
    expect(formatChessComStats({ chess_rapid: null, chess_blitz: { last: null } })).toBeNull();
  });
});

describe('statsUrl', () => {
  it('lowercases and encodes the username', () => {
    expect(statsUrl('Fruit_Keeper')).toBe('https://api.chess.com/pub/player/fruit_keeper/stats');
    expect(statsUrl('a b')).toBe('https://api.chess.com/pub/player/a%20b/stats');
  });
});

describe('CHESSCOM_USERNAME', () => {
  it('accepts valid usernames and rejects others', () => {
    for (const ok of ['abc', 'Hikaru', 'magnus_carlsen', 'x-y-z', 'a'.repeat(25)]) expect(ok).toMatch(CHESSCOM_USERNAME);
    for (const bad of ['', 'ab', 'a'.repeat(26), 'has space', 'é', 'a/b']) expect(bad).not.toMatch(CHESSCOM_USERNAME);
  });
});
