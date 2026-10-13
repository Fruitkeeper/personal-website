// Contact dock behavior: magnetic buttons and copy-email-on-click.
// Pure math lives in src/lib/magnet.ts.
import { magnetOffset } from '../lib/magnet';

const MAGNET_RADIUS = 90; // px from a button's center
const MAGNET_PULL = 10; // max px a button moves
const COPIED_MS = 1800;

function setupMagnets(buttons: HTMLElement[]) {
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let last: PointerEvent | null = null;

  const apply = () => {
    frame = 0;
    if (!last) return;
    const enabled = finePointer.matches && !reducedMotion.matches;
    for (const el of buttons) {
      // Measure without our own offset, so the magnet doesn't chase itself.
      const rect = el.getBoundingClientRect();
      const ox = parseFloat(el.style.getPropertyValue('--mx')) || 0;
      const oy = parseFloat(el.style.getPropertyValue('--my')) || 0;
      const cx = rect.left + rect.width / 2 - ox;
      const cy = rect.top + rect.height / 2 - oy;
      const o = enabled ? magnetOffset(last.clientX - cx, last.clientY - cy, MAGNET_RADIUS, MAGNET_PULL) : { x: 0, y: 0 };
      el.style.setProperty('--mx', `${o.x.toFixed(2)}px`);
      el.style.setProperty('--my', `${o.y.toFixed(2)}px`);
    }
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(apply);
    },
    { passive: true },
  );
  document.documentElement.addEventListener('pointerleave', () => {
    for (const el of buttons) {
      el.style.removeProperty('--mx');
      el.style.removeProperty('--my');
    }
  });
}

function setupCopyEmail(link: HTMLAnchorElement, status: HTMLElement | null) {
  const email = link.dataset.copyEmail!;
  const label = link.querySelector<HTMLElement>('[data-label]');
  let timer = 0;

  link.addEventListener('click', (e) => {
    // Modified clicks keep their usual meaning (open mail app in a new context).
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !navigator.clipboard) return;
    e.preventDefault();
    navigator.clipboard.writeText(email).then(
      () => {
        link.dataset.copied = '';
        if (label) label.textContent = 'Copied!';
        if (status) status.textContent = `Copied ${email} to the clipboard`;
        clearTimeout(timer);
        timer = window.setTimeout(() => {
          delete link.dataset.copied;
          if (label) label.textContent = email;
          if (status) status.textContent = '';
        }, COPIED_MS);
      },
      // Clipboard blocked (permissions, insecure context): fall back to the mail app.
      () => (window.location.href = link.href),
    );
  });
}

export function mountContact() {
  setupMagnets([...document.querySelectorAll<HTMLElement>('[data-magnet]')]);
  const email = document.querySelector<HTMLAnchorElement>('[data-copy-email]');
  if (email) setupCopyEmail(email, document.querySelector('[data-copy-status]'));
}
