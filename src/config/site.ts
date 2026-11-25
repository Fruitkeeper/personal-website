// Everything personal lives here: name, links, credits.

/**
 * Third-party assets that require attribution. Currently only emitted as
 * <meta name="attribution"> (Base.astro); CC BY expects a visible credit.
 */
export type Credit = { work: string; author: string; href: string; license: string; licenseHref: string };

export const site = {
  name: 'Luis Gomez-Acebo',
  location: 'Madrid, Spain',
  description: 'Luis Gomez-Acebo builds AI products and robots: co-founder of Skoll, drone-swarm researcher, OpenAI hackathon winner. Based in Madrid.',
} as const;

export const contact = {
  github: 'https://github.com/Fruitkeeper',
  linkedin: 'https://www.linkedin.com/in/luis-gomez-acebo-martin-retortillo/',
  x: 'https://x.com/Fruitkeeperr',
  email: 'gomez.acebo.luis@gmail.com',
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
