// Lights the segments of a seven-segment display (BasketballWidget.astro).
import { SEGMENTS, scoreDigits } from '../lib/widget-art';

export function setSevenSeg(display: HTMLElement, n: number) {
  const digits = [...display.querySelectorAll('svg')];
  scoreDigits(n, digits.length).forEach((d, i) => {
    const lit = d === null ? '' : SEGMENTS[d];
    for (const seg of digits[i].querySelectorAll<SVGElement>('[data-seg]')) {
      seg.classList.toggle('on', lit.includes(seg.dataset.seg!));
    }
  });
}
