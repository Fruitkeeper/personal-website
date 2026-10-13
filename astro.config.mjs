// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// TODO: replace with your real domain once it's connected in Vercel.
const SITE_URL = 'https://your-domain.com';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  integrations: [sitemap(), react()],
  vite: {
    plugins: [tailwindcss()],
    build: {
      // The Spline runtime ships ~1.5–2MB of JS across a few chunks. It's
      // client:only and code-split, so it never blocks first paint.
      chunkSizeWarningLimit: 700,
    },
  },
});
