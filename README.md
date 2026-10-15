# Personal website

A single page: your name, a 3D sad toaster robot (Three.js) whose head follows your cursor, small live widgets around it that open into things to play with, and a contact dock. Built with Astro; deployed on Vercel.

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
- `site` — your name, tagline (top-left) and location.
- `about` — the About page (`/about`): intro, experience timeline, side projects, education, tools & languages. Drafted from your CV; the phone number is deliberately left off (a test enforces it).
- `widgets` — the cards around the toaster, alternating left/right in order. Each has a `kind`:
  - `markets` — live BTC/ETH (CoinGecko); the toaster's mood follows the average 24h move. Coins: `markets.coins`.
  - `basketball` — Toast-ketball: flick toast into the toaster's slot.
  - `chess` — the Lichess daily puzzle. **Set `chess.lichess`** to show your ratings.
  - `project` — a project (title, role, period, description, highlights, tags, public links). All projects render together as one fanned deck of sticker cards.
- `credits` — attribution for third-party assets. Currently only in a `<meta name="attribution">` tag; the toaster's CC BY-NC license expects a visible credit.

## Pieces

- **Widgets** (`src/components/Widgets.astro`, designs in `src/components/widgets/`): each is a distinct object, not a card template — a CRT trading terminal (live prices, block-character sparklines, mood with a blinking cursor), a walnut mini board showing today's actual puzzle position with a brass plate and a SOLVED ink stamp, an LED seven-segment scoreboard for your best Toast-ketball streak and a sticker-style player card for the project. They float, tilt in 3D toward the cursor with a glare (`src/scripts/tilt.ts`), and open their panels on click (`src/components/panels/*Panel.astro`). Pure helpers + tests in `src/lib/widget-art.ts`. Each widget's `side` (config) places it left/right of the toaster; below 900px everything stacks.
- **Toaster reactions**: planets talk to the 3D scene via window events — `toaster:mood` (markets) and `toaster:hop` (a make, a solved puzzle).
- **External data**: CoinGecko and Lichess public APIs, called from the browser (no keys). Each panel degrades gracefully when its API is unreachable.
- **Contact dock** (`src/components/Contact.astro`, `src/scripts/contact.ts`, math in `src/lib/magnet.ts`): GitHub, LinkedIn, X, email — magnetic buttons with a spinning gradient ring and slide-out labels. Clicking email copies the address (falls back to `mailto:`).

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
