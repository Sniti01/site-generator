// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import afterBuild from '@factory/core/gates/after-build.mjs';
import anchors from '@factory/core/gates/anchors.mjs';

export default defineConfig({
  // Канонический адрес с `www` — слово владельца 2026-09-18 (П62 п. 4), как
  // П55 у первого сайта; ставится с первой сборки, в пиксели не попадает
  // (MIGRATION.md §9). Значение идёт в `canonical` каждой страницы и в sitemap.
  site: 'https://www.7thserpent.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Сторожа результата (читают dist/) — интеграции, не позиции `npm run gates`.
  // Подключены с первой сборки: `afterBuild` (ровно один h1) и `anchors`
  // (якоря). НЕ подключены — и это решение, не пропуск (П62):
  //   `links({ structure })` и `corridor({ structure })` отказывают на пустой
  //   структуре (core/gates/links.mjs, corridor.mjs) — подключаются вместе
  //   с деревом S2, как П42/П43 у первого сайта;
  //   `art()` — после ответа по бэклогу 47 п. 9 (ассеты в git или гейт после
  //   первого `gameart`/`art`).
  integrations: [sitemap(), afterBuild(), anchors()],
  vite: {
    plugins: [tailwindcss()],
  },
});
