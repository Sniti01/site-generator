/**
 * СТОРОЖ УТЕЧКИ МАСТЕРОВ — в сборке нет файлов, побайтно равных исходным картинкам сайта
 * (П102 блок Б; бэклог 59 п. 6, 61 п. 2).
 *
 * Astro кладёт в сборку оригинал импортированной картинки в двух случаях (`astro/dist/assets`):
 * (1) картинка импортирована, но не прошла через `getImage` — не напечатана ни одной страницей
 * (глоб разрешателя кадров импортирует все файлы папки, П86); (2) картинка напечатана, но кто-то
 * прочёл свойство импорта, которое у картинки есть (`width`, `height`, `src`, `format`, разворот,
 * `JSON.stringify`, `String()`; кроме служебных `clone` и `fsPath`; отсутствующее свойство, `in`
 * и `Object.keys` не помечают — замер раунда 2 правки маршрута, P2-7) — оригинал помечен
 * используемым (сессия 10: 12 мастеров панелей; сессия 16: 14 мастеров героев, П102 п. 1). В обоих случаях сборка зелёная и страницы верны —
 * мастер лежит в `dist/` мёртвым весом, и увидеть его можно только сверкой байтов. Сторож её
 * и делает: SHA-256 каждой исходной картинки против каждого файла сборки.
 *
 * КРУГ ИСХОДНИКОВ — растровые картинки (`jpg`, `jpeg`, `png`, `webp`, `avif`, `gif`, `tif`, `tiff`)
 * в папках исходников сайта (по умолчанию — весь `src/`: поле `image()` коллекции и картинка рядом
 * с данными утекают тем же механизмом; раунд 1 «судью судят» блока Б, B1-G-13). SVG — не мастер:
 * Astro печатает его без преобразования, побайтная копия в сборке законна. СТРОГО (раунд 2, B2-10):
 * законная побайтная копия растра из `src/` — картинка для CSS `url()`, импорт `?url`, копия
 * в `public/` под `og:image` — тоже отказ: такой растр кладётся в `public/` и не копией `src/`.
 *
 * ГРОМКО: нет папки исходников или в ней ноль картинок — отказ (сторож о пустом множестве
 * «утечек нет» не говорит). Круг сборки — вся сборка, а не только `_astro/`: мастер, скопированный
 * в `public/` под своим именем, тоже мёртвый вес; ссылка на папку в сборке обходится.
 *
 * ПРЕДЕЛ: равенство — побайтное; мастер, пережатый без изменения размеров (другой JPEG), сторож
 * не видит — такой файл Astro сам не пишет. Сжатые копии (`.gz`, `.br`) не раскрываются — сжатия
 * в сборках фабрики нет. Входные форматы Astro и Vite вне списка (`.apng`, `.bmp`, `.ico`, `.jfif`)
 * мастерами не считаются; растр меньше 4096 Б через CSS `url()` или `?url` и любой через `?inline`
 * Vite встраивает `data:`-адресом — файла-копии нет, сторож его не видит (раунд 2 правки маршрута,
 * P2-5, P2-6, test.todo; блок Б исчерпал три раунда — пределы, не правка).
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Растровые картинки — то, что Astro преобразует и чей оригинал может утечь. */
const KARTINKI = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.tif', '.tiff']);

/** Все файлы под папкой; ссылки на папки обходятся (раунд 1 блока Б, B1-G-13: не EISDIR). */
const obhod = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = join(d, e.name);
    const papka = e.isDirectory() || (e.isSymbolicLink() && statSync(p).isDirectory());
    return papka ? obhod(p) : [p];
  });
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');

/**
 * Утечки: `[{ fajl, master }]` — файл сборки (от `dist`) и исходная картинка (от своей папки
 * исходников), побайтно равные. `istochniki` — папка или список папок. Бросает, если папки нет
 * или картинок в них ноль.
 */
export function utechki(dist, istochniki) {
  const poHeshu = new Map();
  let masterov = 0;
  for (const papka of [istochniki].flat()) {
    if (!existsSync(papka)) throw new Error(`сторож утечки: нет папки исходников ${papka}`);
    for (const f of obhod(papka)) {
      if (!KARTINKI.has(extname(f).toLowerCase())) continue;
      masterov += 1;
      poHeshu.set(sha(f), relative(papka, f).replace(/\\/g, '/'));
    }
  }
  if (!masterov) throw new Error(`сторож утечки: в ${[istochniki].flat().join(', ')} ноль картинок — «утечек нет» о пустом множестве не выдаётся`);
  const out = [];
  for (const f of obhod(dist)) {
    const m = poHeshu.get(sha(f));
    if (m) out.push({ fajl: relative(dist, f).replace(/\\/g, '/'), master: m });
  }
  return { utechki: out, masterov };
}

/**
 * Интеграция Astro. `istochniki` — папка или папки исходников от корня сайта (по умолчанию `src`).
 * @returns {import('astro').AstroIntegration}
 */
export default function masters({ istochniki = 'src' } = {}) {
  let koren = null;
  return {
    name: 'factory:masters',
    hooks: {
      'astro:config:done': ({ config }) => {
        koren = fileURLToPath(config.root);
      },
      'astro:build:done': ({ dir, logger }) => {
        const papki = [istochniki].flat();
        const r = utechki(fileURLToPath(dir), papki.map((p) => join(koren, p)));
        if (r.utechki.length) {
          logger.error(`утечка мастеров: ${r.utechki.length}`);
          throw new Error(
            `В сборке ${r.utechki.length} файлов, побайтно равных исходным картинкам (${papki.join(', ')}):\n` +
              r.utechki.map((u) => `  ${u.fajl} = ${u.master}`).join('\n') +
              '\nМастер уходит в сборку, если картинка импортирована, но не напечатана, или если прочитано свойство импорта ' +
              '(width, height, src, format…): размеры берите из данных сайта, не из импорта; непечатаемую картинку уберите из папки; ' +
              'растр, который нужен сборке как есть (CSS url(), ?url, og:image), держите в public/ и не копией src/.'
          );
        }
        logger.info(`утечка мастеров: исходных картинок ${r.masterov} (${papki.join(', ')}), в сборке ни одной`);
      },
    },
  };
}
