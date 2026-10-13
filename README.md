# Personal website

Astro + Three.js portfolio and blog, deployed on Vercel.

## Make it yours

| What                      | Where                                   |
| ------------------------- | --------------------------------------- |
| Name, bio, links, projects | `src/config/site.ts`                   |
| Domain (for RSS/sitemap)  | `SITE_URL` in `astro.config.mjs`        |
| Colors & fonts            | `:root` tokens in `src/styles/global.css` |
| Blog posts                | `src/content/blog/*.md`                 |
| Hero 3D scene             | `src/scripts/hero-scene.ts`             |

Posts with `draft: true` show up in dev but are excluded from production builds.

## Commands

| Command          | Does                                         |
| ---------------- | -------------------------------------------- |
| `npm run dev`    | Dev server at http://localhost:4321          |
| `npm test`       | Unit tests (Vitest)                          |
| `npm run check`  | Type-check `.astro` and `.ts` files          |
| `npm run verify` | check + test + production build              |
| `npm run build`  | Build static site to `dist/`                 |

## Graphics

- **Split layout** — fixed 40% visual panel starts on the right and slides to the left over the first ~80% of a screen of scroll, while the 60% text column moves right (`src/lib/split.ts`, `src/scripts/split.ts`). Each page picks a palette via `<Base visual="…">` (`src/lib/visuals.ts`). Phones get the visual as a top banner; reduced-motion users get no slide.
- **Visual panel** — Three.js shader blob (simplex-noise displacement, fresnel iridescence) with a particle field and pointer parallax. Lazy-loaded after first paint; pauses offscreen and in hidden tabs; renders a still frame under `prefers-reduced-motion`; CSS gradient fallback without WebGL.
- **Cards** — pointer-tracking spotlight, 3D tilt, drifting gradient orbs.
- **Global** — scroll reveals, cursor glow, film grain, shimmering gradient text.

## Deploy (Vercel)

Astro is auto-detected, no config needed. Either push to GitHub and import the repo at vercel.com/new, or run `vercel` from this folder.
