# Personal website

A single full-screen page: a 3D sad toaster robot (Three.js) whose head follows your cursor, with projects orbiting around it and a contact dock in the corner. Built with Astro; deployed on Vercel.

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

- `contact` — GitHub, LinkedIn, X, email. **LinkedIn and X are placeholders (`your-handle`).**
- `projects` — the orbiting cards (title, one-line summary, description, tags, public links). 2–8 projects fit the orbit.
- `credits` — attribution for third-party assets (shown via the ⓘ in the dock).

## Pieces

- **Orbit** (`src/components/Orbit.astro`, `src/scripts/orbit.ts`, math in `src/lib/orbit.ts`): projects ride a flat ring around the toaster, always in front of it and clickable. Hover/focus or an open project stops it. Click opens a project dialog. The ring is sized to the viewport (taller on phones). Reduced motion: static.
- **Contact dock** (`src/components/Contact.astro`, `src/scripts/contact.ts`, math in `src/lib/magnet.ts`): magnetic buttons with a spinning gradient ring and slide-out labels. Clicking email copies the address (falls back to `mailto:`).

## The toaster

- Scene: `src/scripts/toaster-scene.ts` (pure math in `src/lib/toaster.ts`), mounted by `src/components/Toaster.astro`.
- Framing (how big it appears) is `FRAME_MARGIN` in `src/scripts/toaster-scene.ts`. Only the head turns toward the cursor; the body bobs and hops when clicked. Paused in hidden tabs; still frame under `prefers-reduced-motion`; glow placeholder if WebGL or the model fails.

## The 3D model

The source `sad_toaster.glb` (Sketchfab export, 4.4MB) is gitignored. `npm run build:model` (`tools/build-model.mjs`) turns it into `public/models/sad-toaster.glb` (~0.5MB):

1. converts the legacy spec/gloss material to metal/rough (three.js no longer reads spec/gloss);
2. splits the mesh into **Body** and **Head** by connected parts above `NECK_Y`, and adds a `HeadPivot` node at the neck rod, which the site rotates so only the head turns;
3. compresses (meshopt geometry, 1024px WebP texture), keeping that node hierarchy.

`node tools/build-model.mjs analyze|islands sad_toaster.glb` prints the height profile and parts used to choose `NECK_Y`.

For a different model: adjust `NECK_Y` (or drop the split; the site just won't turn a head it can't find), update `MODEL_URL`/`MODEL_YAW` in `src/scripts/toaster-scene.ts`, and its credit in `src/config/site.ts`. The model is auto-scaled and framed.

**License:** “Sad toaster” by Tasha.Lime is CC BY-NC 4.0 — credit required (in the footer), no commercial use.
