// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import afterBuild from '@factory/core/gates/after-build.mjs';

export default defineConfig({
  site: 'https://ac4bf-thewatch.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // `afterBuild` — jedyna bramka, która czyta WYNIK (dist/), nie źródła;
  // dlatego jest integracją, a nie pozycją w `npm run gates`. Od 2026-09-11.
  integrations: [sitemap(), afterBuild()],
  vite: {
    plugins: [tailwindcss()],
  },
});
