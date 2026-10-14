// Chess widget board: today's Lichess puzzle on a click-to-move board.
// Lazy-loaded by scripts/chess.ts the first time the widget opens, so
// chess.js never weighs on the initial page. Puzzle logic: src/lib/chess-puzzle.ts.
import { Chess, type Square } from 'chess.js';
import { parsePuzzle, playReply, prettyTheme, promotionFor, splitUci, tryMove, type Puzzle } from '../lib/chess-puzzle';
import { HOP_EVENT } from '../lib/toaster';
import { fetchDailyRaw, markSolved } from './chess';

const REPLY_DELAY_MS = 450;
const FILES = 'abcdefgh';
// Solid glyphs for both sides (colored by CSS). U+FE0E keeps ♟ from turning into an emoji.
const GLYPH: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟\uFE0E' };
const NAME: Record<string, string> = { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' };
const WRONG = ['Not that one — the toaster expected better.', 'Nope. Even the toaster saw that one.', 'Try again — think forcing.'];

/** Today's puzzle, sharing the widget's per-day cache of the raw response. */
async function loadPuzzle(): Promise<Puzzle> {
  const puzzle = parsePuzzle(await fetchDailyRaw());
  if (!puzzle) throw new Error('Unexpected puzzle data');
  return puzzle;
}

async function loadRating(user: string): Promise<string | null> {
  const res = await fetch(`https://lichess.org/api/user/${encodeURIComponent(user)}`, { headers: { accept: 'application/json' } });
  if (!res.ok) return null;
  const perfs = (await res.json())?.perfs ?? {};
  const parts = (['puzzle', 'blitz', 'rapid'] as const)
    .filter((k) => typeof perfs[k]?.rating === 'number')
    .map((k) => `${k} ${perfs[k].rating}`);
  return parts.length ? `My Lichess ratings: ${parts.join(' · ')}` : null;
}

export function setupChess(root: HTMLElement, dialog: HTMLDialogElement) {
  const boardEl = root.querySelector<HTMLElement>('[data-board]')!;
  const meta = root.querySelector<HTMLElement>('[data-chess-meta]')!;
  const status = root.querySelector<HTMLElement>('[data-chess-status]')!;
  const hintBtn = root.querySelector<HTMLButtonElement>('[data-chess-hint]')!;
  const retryBtn = root.querySelector<HTMLButtonElement>('[data-chess-retry]')!;
  const link = root.querySelector<HTMLAnchorElement>('[data-chess-link]')!;
  const ratingEl = root.querySelector<HTMLElement>('[data-chess-rating]')!;

  let puzzle: Puzzle | null = null;
  let game = new Chess();
  let ply = 0;
  let selected: Square | null = null;
  let hint: Square | null = null;
  let lastMove: string | null = null;
  let busy = false;
  let solved = false;
  let loaded = false;

  const solverColor = () => (puzzle ? new Chess(puzzle.fen).turn() : 'w');

  const render = () => {
    const flip = solverColor() === 'b';
    const targets = new Set(selected ? game.moves({ square: selected, verbose: true }).map((m) => m.to) : []);
    const board = game.board();
    const cells: HTMLButtonElement[] = [];
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const rank = flip ? r : 7 - r;
        const file = flip ? 7 - f : f;
        const sq = `${FILES[file]}${rank + 1}` as Square;
        const piece = board[7 - rank][file];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.square = sq;
        btn.className = (file + rank) % 2 ? 'light' : 'dark';
        if (lastMove && (lastMove.startsWith(sq) || lastMove.slice(2, 4) === sq)) btn.classList.add('last');
        if (sq === selected) btn.classList.add('selected');
        if (sq === hint) btn.classList.add('hint');
        if (targets.has(sq)) btn.classList.add('target', ...(piece ? ['occupied'] : []));
        if (piece) {
          const span = document.createElement('span');
          span.className = piece.color;
          span.textContent = GLYPH[piece.type];
          span.setAttribute('aria-hidden', 'true');
          btn.append(span);
        }
        btn.setAttribute('aria-label', piece ? `${sq}, ${piece.color === 'w' ? 'white' : 'black'} ${NAME[piece.type]}` : sq);
        btn.tabIndex = -1;
        cells.push(btn);
      }
    }
    // One tab stop for the board; arrow keys move between squares (see keydown below).
    const focusSq = selected ?? (document.activeElement as HTMLElement | null)?.dataset?.square;
    (cells.find((c) => c.dataset.square === focusSq) ?? cells[0]).tabIndex = 0;
    boardEl.replaceChildren(...cells);
    hintBtn.disabled = !puzzle || solved || busy;
    retryBtn.disabled = !puzzle || (ply === 0 && !solved);
  };

  const reset = () => {
    if (!puzzle) return;
    game = new Chess(puzzle.fen);
    ply = 0;
    selected = hint = null;
    lastMove = puzzle.lastMove;
    solved = busy = false;
    status.textContent = `${solverColor() === 'w' ? 'White' : 'Black'} to move. Find the best line.`;
    render();
  };

  const attempt = (from: Square, to: Square) => {
    if (!puzzle) return;
    const expected = puzzle.solution[ply];
    const piece = game.get(from);
    const promoting = piece?.type === 'p' && (to[1] === '8' || to[1] === '1');
    const uci = `${from}${to}${promoting ? promotionFor(from, to, expected) : ''}`;
    const result = tryMove(game, puzzle, ply, uci);
    selected = hint = null;
    if (result === 'illegal') return render();
    if (result === 'wrong') {
      status.textContent = WRONG[Math.floor(Math.random() * WRONG.length)];
      boardEl.classList.remove('shake');
      void boardEl.offsetWidth; // restart the animation
      boardEl.classList.add('shake');
      return render();
    }
    lastMove = uci;
    if (result === 'solved') {
      solved = true;
      status.textContent = 'Solved! The toaster is impressed. 🎉';
      markSolved(puzzle.id);
      window.dispatchEvent(new CustomEvent(HOP_EVENT));
      return render();
    }
    status.textContent = 'Good move…';
    busy = true;
    render();
    setTimeout(() => {
      const reply = playReply(game, puzzle!, ply);
      ply += 2;
      lastMove = reply;
      busy = false;
      status.textContent = 'Keep going.';
      render();
    }, REPLY_DELAY_MS);
  };

  boardEl.addEventListener('click', (e) => {
    const sq = (e.target as HTMLElement).closest<HTMLElement>('[data-square]')?.dataset.square as Square | undefined;
    if (!sq || !puzzle || busy || solved) return;
    const piece = game.get(sq);
    if (selected && sq !== selected && game.moves({ square: selected, verbose: true }).some((m) => m.to === sq)) {
      return attempt(selected, sq);
    }
    selected = piece && piece.color === game.turn() && sq !== selected ? sq : null;
    render();
    boardEl.querySelector<HTMLElement>(`[data-square="${sq}"]`)?.focus();
  });

  // Arrow keys move focus across squares (one tab stop for the whole board).
  boardEl.addEventListener('keydown', (e) => {
    const cells = [...boardEl.querySelectorAll<HTMLElement>('[data-square]')];
    const i = cells.indexOf(document.activeElement as HTMLElement);
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -8, ArrowDown: 8 }[e.key];
    if (i < 0 || delta === undefined) return;
    e.preventDefault();
    const next = cells[Math.max(0, Math.min(63, i + delta))];
    cells.forEach((c) => (c.tabIndex = -1));
    next.tabIndex = 0;
    next.focus();
  });

  hintBtn.addEventListener('click', () => {
    if (!puzzle || solved) return;
    hint = splitUci(puzzle.solution[ply]).from;
    status.textContent = 'Hint: move the highlighted piece.';
    render();
  });
  retryBtn.addEventListener('click', reset);

  const init = async () => {
    if (loaded) return;
    loaded = true;
    try {
      puzzle = await loadPuzzle();
      const themes = puzzle.themes.slice(0, 3).map(prettyTheme).join(' · ');
      meta.textContent = `Lichess daily puzzle · rated ${puzzle.rating}${themes ? ` · ${themes}` : ''}`;
      link.href = `https://lichess.org/training/${encodeURIComponent(puzzle.id)}`;
      reset();
    } catch (err) {
      console.warn('Chess puzzle unavailable.', err);
      loaded = false; // allow a retry next time the dialog opens
      meta.textContent = "Couldn't reach Lichess right now. Try the daily puzzle there instead.";
      link.href = 'https://lichess.org/training/daily';
    }
    const user = root.dataset.lichess;
    if (user) {
      loadRating(user)
        .then((text) => {
          if (text) {
            ratingEl.textContent = text;
            ratingEl.hidden = false;
          }
        })
        .catch(() => {});
    }
  };

  init();
  // If loading failed, try again the next time the widget is opened.
  new MutationObserver(() => dialog.open && init()).observe(dialog, { attributes: true, attributeFilter: ['open'] });
}
