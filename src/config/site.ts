// Site details and asset credits. Every page reads from here.

/** Third-party assets that require attribution (shown in the corner). */
export type Credit = { work: string; author: string; href: string; license: string; licenseHref: string };

export const site = {
  name: 'Your Name',
  description: 'Personal website of Your Name.',
} as const;

export const credits: Credit[] = [
  {
    work: 'Sad toaster',
    author: 'Tasha.Lime',
    href: 'https://sketchfab.com/3d-models/sad-toaster-9b158486dfa1490eb9157966321283a0',
    // Non-commercial: fine for a personal site; ask the author before commercial use.
    license: 'CC BY-NC 4.0',
    licenseHref: 'https://creativecommons.org/licenses/by-nc/4.0/',
  },
];
