import { describe, expect, it } from 'vitest';
import { crest } from '../src/lib/crest';

describe('crest', () => {
  it.each([
    ['UAV Swarm', 'UAV'],
    ['Mister Manager', 'MM'],
    ['Skoll', 'SK'],
    ['  internal  tools portal ', 'IT'],
    ['AI', 'AI'],
    ['', ''],
  ])('%j → %j', (title, out) => expect(crest(title)).toBe(out));
});
