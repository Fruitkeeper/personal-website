
## Project notes

- Personal content lives in `src/config/site.ts`; pages must read from it rather than hard-coding personal info.
- Post listing goes through `getPosts()` in `src/lib/content.ts` (draft filtering + sorting). Pure helpers live in `src/lib/*.ts` and are unit tested in `tests/`.
- Run `npm run verify` (check + test + build) before considering a change done.
- Every animation must respect `prefers-reduced-motion`.
- Styling: site styles are plain CSS in `src/styles/global.css` (unlayered, loaded after `tailwind.css`, so they win over Tailwind/shadcn base styles where token names collide, e.g. `--border`, `--radius`). Tailwind classes are for React/shadcn components in `src/components/ui/`.
- `<html class="dark">` is fixed: the site is dark-only, and shadcn components read their dark tokens.
