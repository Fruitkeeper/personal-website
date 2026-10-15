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
      /** Your role, e.g. "Co-founder & CPO". */
      role: string;
      /** When, e.g. "2025 – 2026". */
      period: string;
      /** A few sentences on what it is, shown when opened. */
      description: string;
      /** What you did / what came of it — one line each. */
      highlights: string[];
      tags: string[];
      /** Public links only — a private repo would 404 for visitors. */
      links?: Link[];
    })
  | (WidgetBase & { kind: 'markets' })
  | (WidgetBase & { kind: 'basketball' })
  | (WidgetBase & { kind: 'chess' });

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
  // One line under the tagline on the About page.
  location: 'Madrid, Spain',
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
  // Projects render together as a fanned deck of sticker cards (one object on the layout).
  {
    kind: 'project',
    title: 'Skoll',
    summary: 'My last startup: the AI GTM Engineer',
    role: 'Co-founder & CPO',
    period: '2025 – 2026',
    description:
      'Skoll is an AI GTM engineer for B2B teams. It defines your ideal customer profiles, tracks how pipeline and deals perform for each one, and surfaces companies that newly match an ICP and are showing buying signals — then helps run the outreach.',
    highlights: [
      'Took recurring revenue from €0 to €160K ARR in 4 months.',
      'Converted 4 of 4 pilot customers into full €30K contracts.',
      'Owned the product lifecycle from discovery to release; cut release turnaround by 60% with a requirement → spec → ticket → release system.',
    ],
    tags: ['AI agents', 'React', 'FastAPI', 'AWS'],
    links: [{ label: 'useskoll.com', href: 'https://useskoll.com' }],
    color: '#38bdf8',
    side: 'right',
  },
  {
    kind: 'project',
    title: 'UAV Swarm',
    summary: 'Formation flight for a swarm of drones',
    role: 'Research assistant · Swarms Systems Lab',
    period: '2025',
    description:
      'Research in an ERC-funded autonomous robotics group in Granada: getting a swarm of drones to navigate and fly in formation, including where GPS isn’t available. On the side, a voice-controlled swarm of Crazyflie drones.',
    highlights: [
      'Developed navigation and formation-control algorithms for coordinated flight across a swarm of 6 UAVs.',
      'Localized drones to within 0.7 m in GPS-denied environments with a CNN running on NVIDIA Jetson, from vision alone.',
      'Improved position-tracking accuracy by 28% with a SLAM and visual-odometry pipeline.',
      'Built a voice-controlled swarm of 2 Crazyflies: spoken commands parsed via MCP into flight instructions, with guided-vector-field formations.',
    ],
    tags: ['ROS 2', 'Computer vision', 'SLAM', 'C++', 'Python'],
    color: '#a3e635',
    side: 'right',
  },
  {
    kind: 'project',
    title: 'Mister Manager',
    summary: 'Fantasy football with a transfer market',
    role: 'Founder & engineer',
    period: '2026',
    description:
      'A Premier League fantasy game where every real player exists only once per league. Managers bid in a market that refreshes daily, player values move with performance and demand, cash can go into debt, and release clauses let rivals buy your players out from under you.',
    highlights: [
      'Designed the game economy: scarce ownership, daily bidding, dynamic values and release clauses.',
      'Built the Django + django-ninja API on PostgreSQL and the Expo / React Native app.',
    ],
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

// ── About page ──────────────────────────────────────────────────────────────
// Drafted from your CV; edit freely. Your phone number is intentionally left off.

export type Role = {
  org: string;
  /** What the org is, in a few words. */
  orgNote: string;
  role: string;
  place: string;
  period: string;
  points: string[];
  color: string;
  href?: string;
};

export const about = {
  intro: [
    "I'm Luis, a builder based in Madrid. I recently finished Computer Science & AI at IE University.",
    'Most recently I co-founded Skoll, an AI GTM engineer, as CPO, taking it from zero to €160K ARR in four months. Before that I did robotics research: drone swarms that fly in formation, and robots that find their way without GPS.',
    'Away from the keyboard: chess (I was vice-president of IE’s chess club), basketball, Magic: The Gathering, and markets, which is why the toaster’s mood follows crypto.',
  ],
  experience: [
    {
      org: 'Skoll',
      orgNote: 'AI GTM engineer startup',
      role: 'Co-founder & Chief Product Officer',
      place: 'Madrid',
      period: 'Sep 2025 – Jul 2026',
      points: [
        'Scaled recurring revenue from €0 to €160K ARR in 4 months by co-founding and launching an AI GTM engineer agent.',
        'Converted 4 of 4 pilot users into full €30K contracts by owning the product lifecycle from discovery to release.',
        'Cut release turnaround by 60% with a requirement → spec → ticket → release system.',
      ],
      color: '#38bdf8',
      href: 'https://useskoll.com',
    },
    {
      org: 'Swarms Systems Lab',
      orgNote: 'ERC-funded autonomous robotics group',
      role: 'Research Assistant · drone swarms',
      place: 'Granada',
      period: 'Jun – Nov 2025',
      points: [
        'Enabled coordinated formation flight across a swarm of 6 UAVs with navigation and formation-control algorithms.',
        'Localized UAVs to within 0.7 m in GPS-denied environments with a vision-only CNN on NVIDIA Jetson.',
        'Improved position-tracking accuracy by 28% with a SLAM and visual-odometry pipeline.',
      ],
      color: '#a3e635',
    },
    {
      org: 'Cyber Physical Lab',
      orgNote: 'IE University',
      role: 'Research Assistant',
      place: 'Madrid',
      period: 'Mar 2024 – Jun 2025',
      points: [
        'Built an autonomous plant-care robot on ROS, Raspberry Pi, NVIDIA Jetson, OptiTrack and a DJI RoboMaster base.',
        'Implemented guided-vector-field path following in C++ and Python for real-time control of a holonomic robot.',
        'Advanced a research line on blockchain-enabled economies for autonomous robots, with a working prototype.',
      ],
      color: '#c084fc',
    },
    {
      org: 'Zogotech',
      orgNote: 'Data analytics for higher education',
      role: 'ML Engineer',
      place: 'Remote',
      period: 'Jul – Sep 2024',
      points: [
        'Improved student-performance assessment accuracy by 12% with information-theory methods.',
        'Analyzed 15,000 student records and built 3 ML models.',
      ],
      color: '#fbbf24',
    },
  ] satisfies Role[],
  sideProjects: [
    {
      title: 'Fiscochat',
      period: 'Nov 2024',
      text: 'A RAG-based legal AI assistant, co-built in 2 months. Won an OpenAI hackathon and was then sold to an Italian law firm.',
      tags: ['LangChain', 'RAG', 'OpenAI API'],
    },
    {
      title: 'Voice-controlled drone swarm',
      period: 'Jul 2025',
      text: 'Two Crazyflie drones that follow spoken commands: MCP turns speech into flight instructions, and guided vector fields handle following and formations.',
      tags: ['MCP', 'GVF', 'Python'],
    },
  ],
  education: {
    school: 'IE University',
    degree: 'BSc Computer Science & Artificial Intelligence',
    period: '2022 – 2026',
    notes: ['Foundations Fellow', 'Vice-president, Chess Club', 'Machine learning, reinforcement learning, statistics & predictive modelling'],
  },
  skills: ['Python', 'TypeScript', 'C / C++', 'SQL', 'ROS', 'LangGraph', 'LangChain', 'AWS'],
  languages: ['Spanish (native)', 'English (fluent)', 'French (fluent)'],
  talks: ['CNNs & computer vision, AI Mindstone (2024)'],
};
