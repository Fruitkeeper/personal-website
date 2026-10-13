
## Project notes

- The site is one full-screen page showing the toaster (`src/components/Toaster.astro`). The previous full site is at git tag `full-site-before-strip`.
- Site name and asset credits live in `src/config/site.ts`. The toaster's CC BY-NC license requires the visible credit (`src/components/Credits.astro`) — don't remove it.
- Pure logic lives in `src/lib/*.ts` and is unit tested in `tests/`.
- Run `npm run verify` (check + test + build) before considering a change done.
- Every animation must respect `prefers-reduced-motion`.
- React + Tailwind v4 + shadcn are set up (`src/components/ui/`) but not used by the page right now. Site styles are plain CSS in `src/styles/global.css`, loaded after `tailwind.css` so they win where token names collide.
