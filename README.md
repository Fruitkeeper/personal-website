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

- **Hero toaster** — glTF model rendered with Three.js, lazy-loaded after first paint. Sways, leans toward the cursor, hops when clicked. Paused offscreen and in hidden tabs; still frame under `prefers-reduced-motion`; glow placeholder if WebGL or the model fails.
- **Cards** — pointer-tracking spotlight, 3D tilt, drifting gradient orbs.
- **Global** — scroll reveals, film grain, shimmering gradient text, glass cards.

## Deploy (Vercel)

Astro is auto-detected, no config needed. Either push to GitHub and import the repo at vercel.com/new, or run `vercel` from this folder.

## Swapping the 3D model

The source `sad_toaster.glb` (Sketchfab export, 4.4MB) is gitignored. The served copy was converted and compressed (~0.5MB):

```sh
npx @gltf-transform/cli metalrough sad_toaster.glb /tmp/mr.glb
npx @gltf-transform/cli optimize /tmp/mr.glb public/models/sad-toaster.glb \
  --compress meshopt --texture-compress webp --texture-size 1024
```

For a different model, run the same commands, update `MODEL_URL`/`MODEL_YAW` in `src/scripts/toaster-scene.ts`, and its credit in `src/config/site.ts`. The model is auto-scaled and framed.

**License:** “Sad toaster” by Tasha.Lime is CC BY-NC 4.0 — credit required (in the footer), no commercial use.
