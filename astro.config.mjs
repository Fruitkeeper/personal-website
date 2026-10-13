// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// TODO: replace with your real domain once it's connected in Vercel.
const SITE_URL = 'https://your-domain.com';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  integrations: [sitemap()],
  vite: {
    build: {
      // Three.js's WebGLRenderer pulls in most of the core (~130KB gzipped).
      // It's lazy-loaded by the hero after first paint, so the size is accepted.
      chunkSizeWarningLimit: 600,
    },
  },
});
