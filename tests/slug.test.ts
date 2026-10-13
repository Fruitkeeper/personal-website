import { describe, expect, it } from 'vitest';
import { slugify } from '../src/lib/slug';

describe('slugify', () => {
  it.each([
    ['Internal Tools Portal', 'internal-tools-portal'],
    ['This website', 'this-website'],
    ['  Crazyflie   Sim!! ', 'crazyflie-sim'],
    ['Gómez-Acebo', 'gomez-acebo'],
    ['', ''],
  ])('%j → %j', (input, expected) => expect(slugify(input)).toBe(expected));
});
