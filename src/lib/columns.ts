/** Alternate items left/right (first item left), preserving order within each side. */
export function splitColumns<T>(items: readonly T[]): { left: T[]; right: T[] } {
  return {
    left: items.filter((_, i) => i % 2 === 0),
    right: items.filter((_, i) => i % 2 === 1),
  };
}
