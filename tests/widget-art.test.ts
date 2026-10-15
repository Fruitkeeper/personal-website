import { describe, expect, it } from 'vitest';
import { blockSpark, fenBoard, tilt } from '../src/lib/widget-art';

describe('blockSpark', () => {
  it('maps lowest to ▁ and highest to █', () => {
    expect(blockSpark([1, 2, 3, 4, 5, 6, 7, 8], 8)).toBe('▁▂▃▄▅▆▇█');
  });
  it('downsamples to the requested width', () => {
    const s = blockSpark(Array.from({ length: 168 }, (_, i) => i), 12);
    expect([...s]).toHaveLength(12);
    expect(s[0]).toBe('▁');
    expect([...s].at(-1)).toBe('█');
  });
  it('never makes more columns than points', () => {
    expect([...blockSpark([1, 5, 2], 20)]).toHaveLength(3);
  });
  it('draws a flat series mid-height', () => {
    expect(blockSpark([3, 3, 3], 3)).toBe('▄▄▄');
  });
  it('draws nothing for too little data or no width', () => {
    expect(blockSpark([1], 10)).toBe('');
    expect(blockSpark([1, 2], 0)).toBe('');
    expect(blockSpark([NaN, 1], 5)).toBe('');
  });
});

describe('fenBoard', () => {
  const start = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  it('reads the starting position', () => {
    const b = fenBoard(start)!;
    expect(b.whiteToMove).toBe(true);
    expect(b.squares[0][4]).toEqual({ piece: 'k', white: false }); // e8
    expect(b.squares[7][3]).toEqual({ piece: 'q', white: true }); // d1
    expect(b.squares[4].every((s) => s === null)).toBe(true);
  });
  it('reads side to move', () => {
    expect(fenBoard('8/8/8/8/8/8/8/K6k b - - 0 1')!.whiteToMove).toBe(false);
  });
  it.each(['', 'nonsense', '8/8/8/8/8/8/8 w', '9/8/8/8/8/8/8/8 w', 'rnbqkbnr/ppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w', 'xnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w'])(
    'rejects malformed %j',
    (fen) => expect(fenBoard(fen)).toBeNull(),
  );
});

describe('tilt', () => {
  it('is flat at the center', () => {
    const t = tilt(0.5, 0.5);
    expect(t.rx).toBeCloseTo(0);
    expect(t.ry).toBeCloseTo(0);
  });
  it('leans toward the pointer', () => {
    expect(tilt(1, 0.5).ry).toBe(10); // right edge → turns right
    expect(tilt(0.5, 0).rx).toBe(10); // top edge → tips back
  });
  it('clamps outside the element and handles bad input', () => {
    expect(tilt(5, -5, 8)).toEqual({ rx: 8, ry: 8 });
    const t = tilt(NaN, NaN);
    expect(t.rx).toBeCloseTo(0);
    expect(t.ry).toBeCloseTo(0);
  });
});

import { SEGMENTS, scoreDigits } from '../src/lib/widget-art';

describe('SEGMENTS', () => {
  it('defines all ten digits with 2–7 segments', () => {
    for (let d = 0; d <= 9; d++) {
      expect(SEGMENTS[d]).toMatch(/^[a-g]{2,7}$/);
    }
    expect(SEGMENTS[8]).toBe('abcdefg');
    expect(SEGMENTS[1]).toBe('bc');
  });
});

describe('scoreDigits', () => {
  it('pads with unlit digits', () => expect(scoreDigits(7, 3)).toEqual([null, null, 7]));
  it('shows a lone zero', () => expect(scoreDigits(0, 2)).toEqual([null, 0]));
  it('shows multi-digit numbers', () => expect(scoreDigits(42, 2)).toEqual([4, 2]));
  it('clamps to the display', () => expect(scoreDigits(1234, 2)).toEqual([9, 9]));
  it('handles bad input as zero', () => {
    expect(scoreDigits(-5, 2)).toEqual([null, 0]);
    expect(scoreDigits(NaN, 2)).toEqual([null, 0]);
  });
});
