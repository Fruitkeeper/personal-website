// Everything personal lives here: name, links, projects, credits.

export type Link = { label: string; href: string };

type PlanetBase = {
  title: string;
  /** One line, shown on hover. */
  summary: string;
  /** Planet color (hex). The markets planet recolors itself by mood. */
  color: string;
};

/** Each planet is a different kind of experience; `kind` picks the panel it opens. */
export type Planet =
  | (PlanetBase & {
      kind: 'project';
      /** A few sentences, shown when opened. */
      description: string;
      tags: string[];
      /** Public links only — a private repo would 404 for visitors. */
      links?: Link[];
    })
  | (PlanetBase & { kind: 'markets' })
  | (PlanetBase & { kind: 'basketball' })
  | (PlanetBase & { kind: 'chess' })
  | (PlanetBase & { kind: 'magic' });

export type PlanetKind = Planet['kind'];

/**
 * Third-party assets that require attribution. Currently only emitted as
 * <meta name="attribution"> (Base.astro); CC BY expects a visible credit.
 */
export type Credit = { work: string; author: string; href: string; license: string; licenseHref: string };

export const site = {
  name: 'Luis Gomez-Acebo',
  description: 'Personal website of Luis Gomez-Acebo.',
} as const;

export const contact = {
  github: 'https://github.com/Fruitkeeper',
  // TODO: replace with your LinkedIn profile URL.
  linkedin: 'https://www.linkedin.com/in/your-handle',
  // TODO: replace with your X profile URL.
  x: 'https://x.com/your-handle',
  email: 'gomez.acebo.luis@gmail.com',
} as const;

export const planets: Planet[] = [
  {
    kind: 'markets',
    title: 'Markets',
    summary: "The toaster's mood follows crypto",
    color: '#94a3b8',
  },
  {
    kind: 'basketball',
    title: 'Toast-ketball',
    summary: 'Flick toast into the slot',
    color: '#fb923c',
  },
  {
    kind: 'chess',
    title: 'Chess',
    summary: "Beat the toaster's daily puzzle",
    color: '#cbd5e1',
  },
  {
    kind: 'magic',
    title: 'Magic',
    summary: 'Rip open a booster',
    color: '#c084fc',
  },
  {
    kind: 'project',
    title: 'Mister Manager',
    summary: 'Fantasy football, priced like a market',
    description:
      'A fantasy football game where player prices move like a market, at LaLiga scale, with leagues. Django + django-ninja API on PostgreSQL, and an Expo / React Native mobile app.',
    tags: ['Django', 'React Native', 'PostgreSQL'],
    color: '#f472b6',
  },
];

/** Coins the Markets planet tracks (CoinGecko ids). Their average 24h move sets the toaster's mood. */
export const markets = {
  coins: ['bitcoin', 'ethereum'],
} as const;

/** Chess planet. Set your Lichess username to show your ratings (empty hides them). */
export const chess = {
  // TODO: your Lichess username.
  lichess: '',
} as const;

/**
 * Magic planet. Set `favorite` to a card's exact English name to guarantee it
 * in every pack (replacing a common), with your note shown under the pack.
 */
export const magic = {
  // TODO: your favorite card, e.g. 'Lightning Bolt', and why you love it.
  favorite: '',
  note: '',
} as const;

export const credits: Credit[] = [
  {
    work: 'Sad toaster',
    author: 'Tasha.Lime',
    href: 'https://sketchfab.com/3d-models/sad-toaster-9b158486dfa1490eb9157966321283a0',
    // CC BY-NC: attribution is required even on a personal site; no commercial use.
    license: 'CC BY-NC 4.0',
    licenseHref: 'https://creativecommons.org/licenses/by-nc/4.0/',
  },
];
