// ─────────────────────────────────────────────────────────────
// Everything personal lives here. Edit this file to make the
// site yours — every page reads from it.
// ─────────────────────────────────────────────────────────────

export type Link = { label: string; href: string };

/** Third-party assets that require attribution (shown in the footer). */
export type Credit = { work: string; author: string; href: string; license: string; licenseHref: string };

export type Project = {
  title: string;
  description: string;
  tags: string[];
  /** Live demo or repo. Omit if the project isn't public. */
  href?: string;
  /** Shown on the home page when true. */
  featured?: boolean;
  /** Gradient used for the card's glow, as two CSS colors. */
  accent?: [string, string];
};

export const site = {
  name: 'Your Name',
  role: 'Engineer & builder',
  tagline: 'I build things for the web, robots, and everything in between.',
  description: 'Personal website, portfolio and writing of Your Name.',
  location: 'Somewhere, Earth',
  email: 'you@example.com',

  bio: [
    'This is a placeholder bio. Write two or three sentences about who you are and what you care about building.',
    'Add a second paragraph about what you are working on right now, or what you want people to reach out about.',
  ],

  socials: [
    { label: 'GitHub', href: 'https://github.com/your-handle' },
    { label: 'X', href: 'https://x.com/your-handle' },
    { label: 'LinkedIn', href: 'https://linkedin.com/in/your-handle' },
  ] satisfies Link[],

  nav: [
    { label: 'Projects', href: '/projects' },
    { label: 'Writing', href: '/blog' },
    { label: 'About', href: '/about' },
  ] satisfies Link[],
} as const;

export const projects: Project[] = [
  {
    title: 'Project One',
    description: 'One-line description of what this does and why it is interesting.',
    tags: ['TypeScript', 'React'],
    href: 'https://github.com/your-handle/project-one',
    featured: true,
    accent: ['#7c5cff', '#22d3ee'],
  },
  {
    title: 'Project Two',
    description: 'Simulation, hardware, ML — whatever it is, say what problem it solves.',
    tags: ['Python', 'Simulation'],
    featured: true,
    accent: ['#f472b6', '#fb923c'],
  },
  {
    title: 'Project Three',
    description: 'A smaller side project or experiment worth showing off.',
    tags: ['Go'],
    href: 'https://github.com/your-handle/project-three',
    featured: true,
    accent: ['#34d399', '#3b82f6'],
  },
  {
    title: 'Project Four',
    description: 'Non-featured projects only appear on the /projects page.',
    tags: ['Rust', 'CLI'],
    accent: ['#facc15', '#ef4444'],
  },
];

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
