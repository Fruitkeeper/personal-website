# Personal website

Astro portfolio and blog with React islands (shadcn/ui + Tailwind v4), a WebGL nebula background and a Spline 3D scene. Deployed on Vercel.

## Make it yours

| What                      | Where                                   |
| ------------------------- | --------------------------------------- |
| Name, bio, links, projects | `src/config/site.ts`                   |
| Domain (for RSS/sitemap)  | `SITE_URL` in `astro.config.mjs`        |
| Colors & fonts            | `:root` tokens in `src/styles/global.css` |
| Blog posts                | `src/content/blog/*.md`                 |
| Panel 3D scene (Spline)   | `SPLINE_SCENE_URL` in `src/lib/visuals.ts` |
| Nebula background shader  | `src/scripts/shaders/nebula.ts`         |
| shadcn/ui components      | `src/components/ui/` (`npx shadcn add …`) |

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

- **Split layout** — fixed 40% visual panel starts on the right and swaps to the left (a fixed 0.9s animation, never scroll-linked) once you scroll ~30% of a screen, and back above ~10%; the 60% text column moves the other way (`src/lib/split.ts`, `src/scripts/split.ts`). Each page picks a palette via `<Base visual="…">` (`src/lib/visuals.ts`). Phones get the visual as a top banner; reduced-motion users get no slide.
- **Visual panel** — Spline robot (`src/components/PanelScene.tsx`) that tracks the cursor anywhere on the page. `client:only` React island, loads after first paint; paused offscreen/in hidden tabs; still frame under `prefers-reduced-motion`; CSS gradient fallback until loaded. Edges are masked so it dissolves into the background.
- **Background** — full-page raw-WebGL nebula (`src/scripts/background.ts`): domain-warped noise in the page palette, bends around the cursor, ripples on click and on panel swaps, stirs with scroll speed. Adaptive resolution, context-loss recovery.
- **Cards** — pointer-tracking spotlight, 3D tilt, drifting gradient orbs.
- **Global** — scroll reveals, film grain, shimmering gradient text, glass cards.

## Deploy (Vercel)

Astro is auto-detected, no config needed. Either push to GitHub and import the repo at vercel.com/new, or run `vercel` from this folder.
