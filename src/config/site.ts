// Everything personal lives here: name, links, projects, credits.

export type Link = { label: string; href: string };

export type Project = {
  title: string;
  /** One line, shown on the orbiting card. */
  summary: string;
  /** A few sentences, shown when the card is opened. */
  description: string;
  tags: string[];
  /** Public links only — a private repo would 404 for visitors. */
  links?: Link[];
  /** Planet color (hex). */
  color: string;
};

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

// Drafted from ~/Desktop/ideas — review the wording before publishing.
export const projects: Project[] = [
  {
    title: 'Mister Manager',
    summary: 'Fantasy football manager',
    description:
      'A fantasy football game with LaLiga-scale player pricing and leagues. Django + django-ninja API on PostgreSQL, and an Expo / React Native mobile app.',
    tags: ['Django', 'React Native', 'PostgreSQL'],
    color: '#f472b6',
  },
  {
    title: 'Internal Tools Portal',
    summary: 'Fintech internal-tools platform',
    description:
      'A shared platform for internal tools — server-side role checks, an append-only audit log, maker-checker approvals and an app registry — with a KYC review app built on top. New apps plug in without touching existing ones.',
    tags: ['TypeScript', 'Platform', 'Fintech'],
    color: '#22d3ee',
    links: [{ label: 'GitHub', href: 'https://github.com/Fruitkeeper/internal-tool-devin-demo' }],
  },
  {
    title: 'Crazyflie Sim',
    summary: 'Drone simulation',
    description:
      'A simulation environment for Crazyflie quadcopters: runs headless in Docker, with a controller loop and a GUI streamed over VNC.',
    tags: ['Robotics', 'Simulation', 'Docker'],
    color: '#facc15',
  },
  {
    title: 'This website',
    summary: 'A toaster that watches you',
    description:
      'Astro + Three.js. The sad toaster model was split at the neck in a build step so only its head turns to follow your cursor; your projects orbit around it.',
    tags: ['Astro', 'Three.js', 'WebGL'],
    color: '#a78bfa',
  },
];

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
