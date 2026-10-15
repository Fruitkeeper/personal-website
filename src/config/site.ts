// Everything personal lives here: name, links, projects, credits.

export type Link = { label: string; href: string };

type WidgetBase = {
  title: string;
  /** One line, shown on the widget. */
  summary: string;
  /** Accent color (hex). The markets widget recolors itself by mood. */
  color: string;
  /** Which side of the toaster it sits on (desktop). */
  side: 'left' | 'right';
};

/**
 * Each widget is a different kind of experience; `kind` picks what it shows
 * and the panel it opens.
 */
export type Widget =
  | (WidgetBase & {
      kind: 'project';
      /** A few sentences, shown when opened. */
      description: string;
      tags: string[];
      /** Public links only — a private repo would 404 for visitors. */
      links?: Link[];
    })
  | (WidgetBase & { kind: 'markets' })
  | (WidgetBase & { kind: 'basketball' })
  | (WidgetBase & { kind: 'chess' })
  | (WidgetBase & { kind: 'magic' });

export type WidgetKind = Widget['kind'];

/**
 * Third-party assets that require attribution. Currently only emitted as
 * <meta name="attribution"> (Base.astro); CC BY expects a visible credit.
 */
export type Credit = { work: string; author: string; href: string; license: string; licenseHref: string };

export const site = {
  name: 'Luis Gomez-Acebo',
  // Shown under your name. Keep it to one short line.
  tagline: 'Builder. Into chess, hoops, Magic and markets.',
  description: 'Personal website of Luis Gomez-Acebo — builder, into chess, basketball, Magic: The Gathering and markets.',
} as const;

export const contact = {
  github: 'https://github.com/Fruitkeeper',
  // TODO: replace with your LinkedIn profile URL.
  linkedin: 'https://www.linkedin.com/in/your-handle',
  // TODO: replace with your X profile URL.
  x: 'https://x.com/your-handle',
  email: 'gomez.acebo.luis@gmail.com',
} as const;

export const widgets: Widget[] = [
  {
    kind: 'markets',
    title: 'Markets',
    summary: "The toaster's mood follows crypto",
    color: '#94a3b8',
    side: 'left',
  },
  {
    kind: 'basketball',
    title: 'Toast-ketball',
    summary: 'Flick toast into the slot',
    color: '#fb923c',
    side: 'right',
  },
  {
    kind: 'chess',
    title: 'Chess',
    summary: "Beat the toaster's daily puzzle",
    color: '#cbd5e1',
    side: 'left',
  },
  {
    kind: 'magic',
    title: 'Magic',
    summary: 'Rip open a booster',
    color: '#c084fc',
    side: 'right',
  },
  {
    kind: 'project',
    title: 'Mister Manager',
    summary: 'Fantasy football, priced like a market',
    description:
      'A fantasy football game where player prices move like a market, at LaLiga scale, with leagues. Django + django-ninja API on PostgreSQL, and an Expo / React Native mobile app.',
    tags: ['Django', 'React Native', 'PostgreSQL'],
    color: '#f472b6',
    side: 'right',
  },
];

/** Coins the Markets widget tracks (CoinGecko ids). Their average 24h move sets the toaster's mood. */
export const markets = {
  coins: ['bitcoin', 'ethereum'],
} as const;

/** Chess widget. Set your Lichess username to show your ratings (empty hides them). */
export const chess = {
  // TODO: your Lichess username.
  lichess: '',
} as const;

/**
 * Magic widget. Set `favorite` to a card's exact English name to guarantee it
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
