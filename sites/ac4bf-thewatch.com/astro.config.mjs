// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import afterBuild from '@factory/core/gates/after-build.mjs';
import anchors from '@factory/core/gates/anchors.mjs';
import links from '@factory/core/gates/links.mjs';
import corridor from '@factory/core/gates/corridor.mjs';

export default defineConfig({
  site: 'https://ac4bf-thewatch.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // `afterBuild` i `anchors` — dwie bramki, które czytają WYNIK (dist/), nie
  // źródła; dlatego są integracjami, a nie pozycjami w `npm run gates`.
  // `afterBuild` (h1) od 2026-09-11 rano; `anchors` (kotwice) tego samego dnia
  // po południu, tą samą poprawką, co `/#zejscie` w `src/data/site.ts` —
  // punkt 24 backlogu, П40 krok 2: bramka zielona od pierwszego budowania.
  // `links` — trzecia bramka wyniku (П42, 2026-09-11): każdy link wewnętrzny
  // na adres ze struktury; rama — cały serwis, przed pierwszą paczką tekstów.
  // `corridor` — czwarta (П43, 2026-09-11, start paczki 1): znaki bez spacji
  // w `<main>` każdej strony mieszczą się w `corridor` z umowy; `null` w umowie —
  // liczba do raportu, bez wyroku. Wyłącznika nie ma: zmienia się liczbę w umowie.
  integrations: [
    sitemap(),
    afterBuild(),
    anchors(),
    links({ structure: 'structure/structure.json' }),
    corridor({ structure: 'structure/structure.json' }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
