import { describe, expect, it } from 'vitest';
import { groupBySide } from '../src/lib/columns';

describe('groupBySide', () => {
  it('groups by side, keeping order', () => {
    const items = [
      { id: 1, side: 'left' as const },
      { id: 2, side: 'right' as const },
      { id: 3, side: 'left' as const },
    ];
    expect(groupBySide(items)).toEqual({ left: [items[0], items[2]], right: [items[1]] });
  });
  it('handles an empty list', () => expect(groupBySide([])).toEqual({ left: [], right: [] }));
});
