// Lightweight DOM effects shared by every page: scroll reveal and card
// spotlight/tilt. Motion-heavy parts no-op under reduced motion.

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

function setupReveal() {
  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (reducedMotion() || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  targets.forEach((el) => observer.observe(el));
}

const MAX_TILT_DEG = 6;

function setupCards() {
  if (!finePointer()) return;
  const allowTilt = !reducedMotion();
  document.querySelectorAll<HTMLElement>('[data-spotlight]').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      card.style.setProperty('--mx', `${x * 100}%`);
      card.style.setProperty('--my', `${y * 100}%`);
      if (allowTilt && card.hasAttribute('data-tilt')) {
        card.style.setProperty('--rx', `${(0.5 - y) * MAX_TILT_DEG}deg`);
        card.style.setProperty('--ry', `${(x - 0.5) * MAX_TILT_DEG}deg`);
      }
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}


setupReveal();
setupCards();
