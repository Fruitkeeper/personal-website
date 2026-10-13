# Personal website

Astro portfolio and blog with a 3D sad toaster in the hero (Three.js), plus React/shadcn/ui + Tailwind v4 available for components. Deployed on Vercel.

## Make it yours

| What                      | Where                                   |
| ------------------------- | --------------------------------------- |
| Name, bio, links, projects | `src/config/site.ts`                   |
| Domain (for RSS/sitemap)  | `SITE_URL` in `astro.config.mjs`        |
| Colors & fonts            | `:root` tokens in `src/styles/global.css` |
| Blog posts                | `src/content/blog/*.md`                 |
| Hero 3D model             | `public/models/sad-toaster.glb`, scene in `src/scripts/toaster-scene.ts` |
| Asset credits (footer)    | `credits` in `src/config/site.ts`       |
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

- **Hero toaster** — glTF model rendered with Three.js, lazy-loaded after first paint. The head turns to follow the cursor (the body stays put), bobs gently, hops when clicked. Paused offscreen and in hidden tabs; still frame under `prefers-reduced-motion`; glow placeholder if WebGL or the model fails.
- **Cards** — pointer-tracking spotlight, 3D tilt, drifting gradient orbs.
- **Global** — scroll reveals, film grain, shimmering gradient text, glass cards.

## Deploy (Vercel)

Astro is auto-detected, no config needed. Either push to GitHub and import the repo at vercel.com/new, or run `vercel` from this folder.

## The 3D model

The source `sad_toaster.glb` (Sketchfab export, 4.4MB) is gitignored. `npm run build:model` (`tools/build-model.mjs`) turns it into `public/models/sad-toaster.glb` (~0.5MB):

1. converts the legacy spec/gloss material to metal/rough (three.js no longer reads spec/gloss);
2. splits the mesh into **Body** and **Head** by connected parts above `NECK_Y`, and adds a `HeadPivot` node at the neck rod, which the site rotates so only the head turns;
3. compresses (meshopt geometry, 1024px WebP texture), keeping that node hierarchy.

`node tools/build-model.mjs analyze|islands sad_toaster.glb` prints the height profile and parts used to choose `NECK_Y`.

For a different model: adjust `NECK_Y` (or drop the split; the site just won't turn a head it can't find), update `MODEL_URL`/`MODEL_YAW` in `src/scripts/toaster-scene.ts`, and its credit in `src/config/site.ts`. The model is auto-scaled and framed.

**License:** “Sad toaster” by Tasha.Lime is CC BY-NC 4.0 — credit required (in the footer), no commercial use.
