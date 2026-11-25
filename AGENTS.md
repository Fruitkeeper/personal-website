
## Project notes

- The site is one screen: `Hero` = name + `Contact` (email + socials) next to the 3D `Toaster`. The moons/panels/widgets/About version is commit `72231aa`; the older multi-page site is at git tag `full-site-before-strip`.
- Everything personal (name, contact, credits) lives in `src/config/site.ts`. The toaster's CC BY-NC credit is currently only a `<meta name="attribution">` (the owner chose to remove the visible one).
- Pure logic lives in `src/lib/*.ts` and is unit tested in `tests/`.
- Run `npm run verify` (check + test + build) before considering a change done.
- Every animation must respect `prefers-reduced-motion`.
- The toaster still listens for window events `toaster:mood` / `toaster:hop` (constants in `src/lib/toaster.ts`); nothing fires them since the widgets were removed.
- React + Tailwind v4 + shadcn are set up (`src/components/ui/`) but not used by the page right now. Site styles are plain CSS in `src/styles/global.css`, loaded after `tailwind.css` so they win where token names collide.
