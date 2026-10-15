
## Project notes

- The site is one page: name (`Intro.astro`), the toaster (`Toaster.astro`), widgets that open panels (`Widgets.astro`), contact dock (`Contact.astro`). The older multi-page site is at git tag `full-site-before-strip`.
- Everything personal (name, contact, widgets, chess/markets settings, About page, credits) lives in `src/config/site.ts`. The toaster's CC BY-NC credit is currently only a `<meta name="attribution">` (the owner chose to remove the visible one).
- Pure logic lives in `src/lib/*.ts` and is unit tested in `tests/`.
- Run `npm run verify` (check + test + build) before considering a change done.
- Every animation must respect `prefers-reduced-motion`.
- Widgets/panels talk to the 3D toaster via window events `toaster:mood` / `toaster:hop` (constants in `src/lib/toaster.ts`).
- React + Tailwind v4 + shadcn are set up (`src/components/ui/`) but not used by the page right now. Site styles are plain CSS in `src/styles/global.css`, loaded after `tailwind.css` so they win where token names collide.
