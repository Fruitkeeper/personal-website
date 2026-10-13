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
    // Pre-bundle three at dev-server start. Otherwise Vite discovers it on the
    // first dynamic import, re-optimizes, and that in-flight import fails.
    optimizeDeps: { include: ['three'] },
    build: {
      // three's WebGLRenderer + GLTFLoader is ~150KB gzipped. It's lazy-loaded
      // by the hero after first paint, so the size is accepted.
      chunkSizeWarningLimit: 700,
    },
  },
});
