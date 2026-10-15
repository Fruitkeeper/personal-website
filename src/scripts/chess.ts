import { fenBoard } from '../lib/widget-art';

// Chess widget entry: tiny on purpose. Shows today's puzzle rating and
// whether you've solved it, without chess.js. The board (and chess.js) load
// only when the panel is first opened (see scripts/chess-board.ts).
export const RAW_CACHE_KEY = 'chess:daily-raw:v1';
export const SOLVED_KEY = 'chess:solved';
const DAILY_URL = 'https://lichess.org/api/puzzle/daily';

export const today = () => new Date().toISOString().slice(0, 10);

/** Today's raw /api/puzzle/daily JSON, cached per UTC day. */
export async function fetchDailyRaw(): Promise<unknown> {
  try {
    const cached = JSON.parse(localStorage.getItem(RAW_CACHE_KEY) ?? 'null');
    if (cached?.date === today()) return cached.json;
  } catch {
    /* storage unavailable or corrupt: fetch */
  }
  const res = await fetch(DAILY_URL, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Lichess ${res.status}`);
  const json = await res.json();
  try {
    localStorage.setItem(RAW_CACHE_KEY, JSON.stringify({ date: today(), json }));
  } catch {
    /* ignore */
  }
  return json;
}

export function isSolved(puzzleId: string): boolean {
  try {
    return localStorage.getItem(SOLVED_KEY) === puzzleId;
  } catch {
    return false;
  }
}

/** Mark today's puzzle solved, in storage and on the widget. */
export function markSolved(puzzleId: string) {
  try {
    localStorage.setItem(SOLVED_KEY, puzzleId);
  } catch {
    /* ignore */
  }
  const state = document.querySelector<HTMLElement>('[data-cw-state]');
  if (state) state.textContent = 'Solved today';
  const tile = document.querySelector<HTMLElement>('[data-cw-tile]');
  if (tile) tile.dataset.solved = '';
}

// Solid glyphs for both sides (colored by CSS). U+FE0E keeps ♟ from turning into an emoji.
const GLYPH: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟\uFE0E' };

/** Draw today's position on the widget's mini board, from the side to move. */
function drawBoard(fen: string) {
  const board = fenBoard(fen);
  const el = document.querySelector<HTMLElement>('[data-cw-board]');
  if (!board || !el) return;
  const flip = !board.whiteToMove;
  const cells = [...el.children] as HTMLElement[];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = board.squares[flip ? 7 - r : r][flip ? 7 - f : f];
      const cell = cells[r * 8 + f];
      cell.textContent = sq ? GLYPH[sq.piece] : '';
      cell.classList.toggle('w', !!sq?.white);
      cell.classList.toggle('b', !!sq && !sq.white);
    }
  }
  const turn = document.querySelector<HTMLElement>('[data-cw-turn]');
  if (turn) turn.textContent = board.whiteToMove ? '♔ White to move' : '♚ Black to move';
}

function updateWidget(json: unknown) {
  const p = (json as { puzzle?: { id?: unknown; rating?: unknown; fen?: unknown } } | null)?.puzzle;
  const line = document.querySelector<HTMLElement>('[data-cw-line]');
  if (line && typeof p?.rating === 'number') line.textContent = `Daily puzzle · ${p.rating}`;
  if (typeof p?.fen === 'string') drawBoard(p.fen);
  if (typeof p?.id === 'string' && isSolved(p.id)) markSolved(p.id);
}

export function mountChess() {
  fetchDailyRaw()
    .then(updateWidget)
    .catch(() => {
      /* the widget keeps its default text; the panel reports errors */
    });

  const root = document.querySelector<HTMLElement>('[data-chess]');
  const dialog = root?.closest('dialog');
  if (!root || !dialog) return;
  let started = false;
  new MutationObserver(() => {
    if (!dialog.open || started) return;
    started = true;
    import('./chess-board')
      .then(({ setupChess }) => setupChess(root, dialog))
      .catch((err) => {
        started = false; // retry on the next open
        console.warn('Chess board failed to load.', err);
        const meta = root.querySelector<HTMLElement>('[data-chess-meta]');
        if (meta) meta.textContent = "Couldn't load the board. Close and reopen to try again.";
      });
  }).observe(dialog, { attributes: true, attributeFilter: ['open'] });
}
