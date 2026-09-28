/**
 * СТОРОЖ УТЕЧКИ МАСТЕРОВ — в сборке нет файлов, побайтно равных исходным картинкам сайта
 * (П102 блок Б; бэклог 59 п. 6, 61 п. 2).
 *
 * Astro кладёт в сборку оригинал импортированной картинки в двух случаях (`astro/dist/assets`):
 * (1) картинка импортирована, но не прошла через `getImage` — не напечатана ни одной страницей
 * (глоб разрешателя кадров импортирует все файлы папки, П86); (2) картинка напечатана, но кто-то
 * прочёл свойство импорта (`width`, `height`, `src`, `format`, разворот, `JSON.stringify`; кроме
 * служебных `clone` и `fsPath`) — оригинал помечен используемым (сессия 10: 12 мастеров панелей;
 * сессия 16: 14 мастеров героев, П102 п. 1). В обоих случаях сборка зелёная и страницы верны —
 * мастер лежит в `dist/` мёртвым весом, и увидеть его можно только сверкой байтов. Сторож её
 * и делает: SHA-256 каждого файла `src/assets/**` против каждого файла сборки.
 *
 * ГРОМКО: нет папки исходных картинок или в ней ноль файлов — отказ (сторож о пустом множестве
 * «утечек нет» не говорит). Круг — вся сборка, а не только `_astro/`: мастер, скопированный
 * в `public/` под своим именем, тоже мёртвый вес.
 *
 * ПРЕДЕЛ: равенство — побайтное; мастер, пережатый без изменения размеров (другой JPEG), сторож
 * не видит — такой файл Astro сам не пишет.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const obhod = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? obhod(join(d, e.name)) : [join(d, e.name)]));
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex');

/**
 * Утечки: `[{ fajl, master }]` — файл сборки (от `dist`) и исходник (от `assets`), побайтно равные.
 * Бросает, если папки исходников нет или она пуста.
 */
export function utechki(dist, assets) {
  if (!existsSync(assets)) throw new Error(`сторож утечки: нет папки исходных картинок ${assets}`);
  const mastera = obhod(assets);
  if (!mastera.length) throw new Error(`сторож утечки: в ${assets} ноль файлов — «утечек нет» о пустом множестве не выдаётся`);
  const poHeshu = new Map();
  for (const f of mastera) poHeshu.set(sha(f), relative(assets, f).replace(/\\/g, '/'));
  const out = [];
  for (const f of obhod(dist)) {
    const m = poHeshu.get(sha(f));
    if (m) out.push({ fajl: relative(dist, f).replace(/\\/g, '/'), master: m });
  }
  return { utechki: out, masterov: mastera.length };
}

/**
 * Интеграция Astro. `assets` — папка исходных картинок от корня сайта (`src/assets`).
 * @returns {import('astro').AstroIntegration}
 */
export default function masters({ assets = 'src/assets' } = {}) {
  let koren = null;
  return {
    name: 'factory:masters',
    hooks: {
      'astro:config:done': ({ config }) => {
        koren = fileURLToPath(config.root);
      },
      'astro:build:done': ({ dir, logger }) => {
        const r = utechki(fileURLToPath(dir), join(koren, assets));
        if (r.utechki.length) {
          logger.error(`утечка мастеров: ${r.utechki.length}`);
          throw new Error(
            `В сборке ${r.utechki.length} файлов, побайтно равных исходным картинкам (${assets}):\n` +
              r.utechki.map((u) => `  ${u.fajl} = ${u.master}`).join('\n') +
              '\nМастер уходит в сборку, если картинка импортирована, но не напечатана, или если прочитано свойство импорта ' +
              '(width, height, src, format…): пропорцию берите из записи кредитов, непечатаемый кадр уберите из папки.'
          );
        }
        logger.info(`утечка мастеров: исходных картинок ${r.masterov}, в сборке ни одной`);
      },
    },
  };
}
