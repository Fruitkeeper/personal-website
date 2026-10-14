// Page-load intro: keeps the page locked (inert + hidden UI) while the lamp
// lights up and the toaster rises, then reveals everything. The lock itself
// is applied before first paint by an inline script in pages/index.astro.
// Timing rules live in src/lib/intro.ts.
import { INTRO_DONE_EVENT, TOASTER_READY_EVENT, unlockAt } from '../lib/intro';

const PENDING = 'intro-pending';
const LAMP_FADE_MS = 1300;

export function mountIntro() {
  const root = document.documentElement;
  const lamp = document.querySelector<HTMLElement>('[data-lamp-intro]');
  if (!root.classList.contains(PENDING)) {
    // No intro (reduced motion, or the safety release already fired).
    if (lamp) lamp.hidden = true;
    return;
  }

  let readyAt: number | null = null;
  let timer = 0;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    root.classList.remove(PENDING);
    document.body.inert = false;
    window.dispatchEvent(new CustomEvent(INTRO_DONE_EVENT));
    // Let the lamp fade out (CSS), then take it out of the page entirely.
    setTimeout(() => lamp && (lamp.hidden = true), LAMP_FADE_MS);
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = window.setTimeout(finish, Math.max(0, unlockAt(readyAt) - performance.now()));
  };

  const onReady = () => {
    readyAt ??= performance.now();
    schedule();
  };
  window.addEventListener(TOASTER_READY_EVENT, onReady, { once: true });
  // The toaster may have finished loading before this script ran.
  if (document.querySelector('[data-toaster-canvas][data-ready]')) onReady();
  schedule();
}
