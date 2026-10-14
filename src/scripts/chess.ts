// Chess planet entry: tiny on purpose. The board and chess.js are imported
// only when the planet is first opened (see scripts/chess-board.ts).
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
