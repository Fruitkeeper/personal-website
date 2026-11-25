# Personal website

One screen: my name and socials next to a 3D toaster robot that watches your cursor. Built with Astro; deployed on Vercel.

> The earlier full site (header, projects, blog, about, RSS) is preserved at the git tag `full-site-before-strip`:
> `git checkout full-site-before-strip -- src tests` restores its files.

## Commands

| Command               | Does                                             |
| --------------------- | ------------------------------------------------ |
| `npm run dev`         | Dev server at http://localhost:4321              |
| `npm test`            | Unit tests (Vitest)                              |
| `npm run check`       | Type-check `.astro` and `.ts` files              |
| `npm run verify`      | check + test + production build                  |
| `npm run build`       | Build static site to `dist/`                     |
| `npm run build:model` | Rebuild `public/models/sad-toaster.glb` from the source model |

## Make it yours

Everything personal is in `src/config/site.ts`:

- `site` — name (the hero), location, and the meta `description` used for search and link previews.
- `contact` — GitHub, LinkedIn, X, email.
- `credits` — third-party attribution (currently only a `<meta name="attribution">`).

## Pieces

- **Home** (`src/pages/index.astro`): `Stars` background + `Hero` (name, `Contact`, `Toaster`).
- **Contact** (`src/components/Contact.astro`, `src/scripts/contact.ts`): click-to-copy email and social icons with a magnetic hover (math in `src/lib/magnet.ts`).

## The toaster

- Scene: `src/scripts/toaster-scene.ts` (pure math in `src/lib/toaster.ts`), mounted by `src/components/Toaster.astro`.
- Framing (how big it appears) is `frameMargin()` in `src/lib/toaster.ts` (tighter on phones). Only the head turns toward the cursor; the body bobs and hops when clicked. Paused in hidden tabs; still frame under `prefers-reduced-motion`; glow placeholder if WebGL or the model fails.

## The 3D model

The source `sad_toaster.glb` (Sketchfab export, 4.4MB) is gitignored. `npm run build:model` (`tools/build-model.mjs`) turns it into `public/models/sad-toaster.glb` (~0.5MB):

1. converts the legacy spec/gloss material to metal/rough (three.js no longer reads spec/gloss);
2. splits the mesh into **Body** and **Head** by connected parts above `NECK_Y`, and adds a `HeadPivot` node at the neck rod, which the site rotates so only the head turns;
3. compresses (meshopt geometry, 1024px WebP texture), keeping that node hierarchy.

`node tools/build-model.mjs analyze|islands sad_toaster.glb` prints the height profile and parts used to choose `NECK_Y`.

For a different model: adjust `NECK_Y` (or drop the split; the site just won't turn a head it can't find), update `MODEL_URL`/`MODEL_YAW` in `src/scripts/toaster-scene.ts`, and its credit in `src/config/site.ts`. The model is auto-scaled and framed.

**License:** “Sad toaster” by Tasha.Lime is CC BY-NC 4.0 — credit required (in the footer), no commercial use.
