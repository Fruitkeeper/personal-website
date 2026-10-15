// Chess entry: tiny on purpose. The board (and chess.js) load only when the
// panel is first opened (see scripts/chess-board.ts).
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

/** Remember that today's puzzle is solved. */
export function markSolved(puzzleId: string) {
  try {
    localStorage.setItem(SOLVED_KEY, puzzleId);
  } catch {
    /* ignore */
  }
}

export function mountChess() {
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
