/** Group items by their `side`, preserving order within each side. */
export function groupBySide<T extends { side: 'left' | 'right' }>(items: readonly T[]): { left: T[]; right: T[] } {
  return {
    left: items.filter((i) => i.side === 'left'),
    right: items.filter((i) => i.side === 'right'),
  };
}
