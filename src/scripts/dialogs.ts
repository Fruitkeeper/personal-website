// Opens each widget's panel (<dialog>) and closes it on a backdrop click.
// Esc and the × button close natively.
export function mountDialogs() {
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-open-dialog]')) {
    const dialog = document.getElementById(button.dataset.openDialog!) as HTMLDialogElement | null;
    if (!dialog) continue;
    button.addEventListener('click', () => dialog.showModal());
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
  }
}
