import { describe, expect, it } from 'vitest';
import { splitColumns } from '../src/lib/columns';

describe('splitColumns', () => {
  it('alternates, starting left', () => {
    expect(splitColumns([1, 2, 3, 4, 5])).toEqual({ left: [1, 3, 5], right: [2, 4] });
  });
  it('handles empty and single lists', () => {
    expect(splitColumns([])).toEqual({ left: [], right: [] });
    expect(splitColumns(['a'])).toEqual({ left: ['a'], right: [] });
  });
});
