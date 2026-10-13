
## Project notes

- Personal content lives in `src/config/site.ts`; pages must read from it rather than hard-coding personal info.
- Post listing goes through `getPosts()` in `src/lib/content.ts` (draft filtering + sorting). Pure helpers live in `src/lib/*.ts` and are unit tested in `tests/`.
- Run `npm run verify` (check + test + build) before considering a change done.
- Every animation must respect `prefers-reduced-motion`.
