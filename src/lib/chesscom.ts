// chess.com public API (api.chess.com/pub, CORS-enabled, no key).

/** chess.com usernames: 3–25 letters, digits, "_" or "-". */
export const CHESSCOM_USERNAME = /^[A-Za-z0-9_-]{3,25}$/;

export function statsUrl(user: string): string {
  return `https://api.chess.com/pub/player/${encodeURIComponent(user.toLowerCase())}/stats`;
}

const rating = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : null);

/**
 * Defensive parse of /pub/player/{user}/stats into one line, e.g.
 * "My chess.com ratings: rapid 1520 · blitz 1410 · puzzles 2105".
 * Null when nothing usable is there (unrated account, odd shape).
 */
export function formatChessComStats(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, { last?: { rating?: unknown }; highest?: { rating?: unknown } } | undefined>;
  const parts = [
    ['rapid', rating(s.chess_rapid?.last?.rating)],
    ['blitz', rating(s.chess_blitz?.last?.rating)],
    ['bullet', rating(s.chess_bullet?.last?.rating)],
    // Tactics only reports a best/worst, not a current rating.
    ['puzzles', rating(s.tactics?.highest?.rating)],
  ] as const;
  const shown = parts.filter(([, r]) => r !== null).map(([k, r]) => `${k} ${r}`);
  return shown.length ? `My chess.com ratings: ${shown.join(' · ')}` : null;
}
