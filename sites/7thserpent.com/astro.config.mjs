// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import afterBuild from '@factory/core/gates/after-build.mjs';
import anchors from '@factory/core/gates/anchors.mjs';
import links from '@factory/core/gates/links.mjs';
import corridor from '@factory/core/gates/corridor.mjs';

export default defineConfig({
  // Канонический адрес с `www` — слово владельца 2026-09-18 (П62 п. 4), как
  // П55 у первого сайта; ставится с первой сборки, в пиксели не попадает
  // (MIGRATION.md §9). Значение идёт в `canonical` каждой страницы и в sitemap.
  site: 'https://www.7thserpent.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Сторожа результата (читают dist/) — интеграции, не позиции `npm run gates`.
  // С первой сборки: `afterBuild` (ровно один h1) и `anchors` (якоря).
  // С пачки 0 (П85 п. 2, бэклог 54 п. 9 — та же точка, что П42/П43 у первого
  // сайта): `links` — каждый `href`/`action` собранных страниц ведёт на адрес
  // структуры (плановый адрес без собранной страницы — законен) или на файл
  // в `dist/`; `corridor` — знаки без пробелов в `<main>` каждой страницы
  // в коридоре из структуры, `null` — число в журнал без приговора.
  // Выключателей у обоих нет: путь мимо отказа — только договор (П43).
  //
  // `art()` НЕ подключён — решение исполнителя пачки 0 (П85 п. 2), и это
  // решение, не пропуск. Гейт ловит два тихих исхода первого сайта: запасную
  // графику (`.skyline` в месте `zapas` у `SmartImage` при ключе без файла)
  // и пустую рамку галереи. У этого сайта нет ни того, ни другого: запасной
  // графики нет вовсе, а ключ без файла или записи прерывает сборку раньше,
  // в разрешателе `src/data/media.ts` (`kadr()` бросает). Сторож, обе ветви
  // которого здесь недостижимы, давал бы зелёную строку о пустом множестве.
  // Условие П62 (бэклог 47 п. 9: ассеты в git) выполнено — вопрос вернётся,
  // если ветвь маршрута начнёт печатать кадр мимо `kadr()` или с запасом.
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
