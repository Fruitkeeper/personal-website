// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// TODO: replace with your real domain once it's connected in Vercel.
const SITE_URL = 'https://luisgomezacebo.com';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  integrations: [sitemap(), react()],
  vite: {
    plugins: [tailwindcss()],
    // Pre-bundle three (and every three/examples module the toaster scene
    // imports) at dev-server start. Otherwise Vite discovers them on the first
    // dynamic import, re-optimizes, and that in-flight import fails in dev.
    // Keep this list in sync with dynamically imported dependencies.
    optimizeDeps: {
      include: [
        'three',
        'three/examples/jsm/loaders/GLTFLoader.js',
        'three/examples/jsm/environments/RoomEnvironment.js',
        'three/examples/jsm/libs/meshopt_decoder.module.js',
        // Lazy-loaded by the chess planet; same dev-only re-optimize issue.
        'chess.js',
      ],
    },
    build: {
      // three's WebGLRenderer + GLTFLoader is ~150KB gzipped. It's lazy-loaded
      // by the hero after first paint, so the size is accepted.
      chunkSizeWarningLimit: 700,
    },
  },
});
