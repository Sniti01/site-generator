#!/usr/bin/env node
/**
 * Приёмка: съёмка кадров по протоколу и проверка снятого набора.
 *
 *   node core/accept/frames.mjs protocol            — печатает порядок съёмки и скрипты страницы
 *   node core/accept/frames.mjs check <новые> <эталон>  — сверяет состав и размеры набора
 *
 * **Браузер этот инструмент не водит, и это решение, а не недоделка.**
 * Съёмка происходит дважды за сессию и руками; тянуть в фабрику драйвер
 * браузера ради двух запусков — цена, которую проект не платил ни за xlsx,
 * ни за PNG. Инструмент даёт воспроизводимой саму **процедуру**: точные
 * скрипты страницы и точный порядок шагов, а также проверяет, что снятый
 * набор соответствует эталонному по составу и размерам.
 *
 * Протокол — `sites/<сайт>/MIGRATION.md` §6 и решения П9, П12, П16:
 * прод-превью (не dev-сервер), `document.fonts.ready`, прокрутка до низа
 * и обратно, смена вьюпорта **без перезагрузки**, полный кадр как сторож
 * и оконный как судья.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';

/** Готовность страницы: шрифты разложены, изображения догружены. */
export const ГОТОВНОСТЬ = `await document.fonts.ready;
const imgs = [...document.images];
await Promise.all(imgs.map(i => i.complete ? null : new Promise(r => { i.onload = i.onerror = r; })));
({ шрифты: 'ready', изображений: imgs.length, загружено: imgs.filter(i => i.complete && i.naturalWidth > 0).length })`;

/**
 * Прокрутка до низа и обратно: без неё ленивые изображения не занимают место,
 * и полный кадр выходит короче — именно отсюда разные высоты у старых снимков
 * `.impeccable/review/` (8678 и 8659).
 */
// `'instant'`, а не `'auto'`: по спецификации `'auto'` значит «как велит CSS»,
// а `src/styles/global.css` ставит `html { scroll-behavior: smooth }`.
export const ПРОКРУТКА = `window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
await new Promise(r => setTimeout(r, 400));
window.scrollTo({ top: 0, behavior: 'instant' });
await new Promise(r => setTimeout(r, 200));
({ высота: document.body.scrollHeight, scrollY: window.scrollY })`;

/** Прокрутка к полосе для оконного кадра: мгновенный прыжок и проверка scrollY. */
export const К_ПОЛОСЕ = (y) => `window.scrollTo({ top: ${y}, behavior: 'instant' });
await new Promise(r => setTimeout(r, 200));
({ scrollY: window.scrollY, ожидали: ${y} })`;

const ПОРЯДОК = [
  'Собрать сайт и поднять прод-превью: npm run build && npm run preview (не dev-сервер:',
  '  в dev Astro включает annotateSourceFile и dev-toolbar, и разметка заведомо не равна прод-сборке).',
  'Открыть страницу с вьюпортом 1440×900.',
  'Выполнить скрипт ГОТОВНОСТЬ, дождаться ответа.',
  'Выполнить скрипт ПРОКРУТКА — до низа и обратно.',
  'Снять оконный кадр 1440×900 и полностраничный кадр 1440.',
  'Сменить вьюпорт на 390×844 БЕЗ перезагрузки: браузер не понижает уже',
  '  загруженное изображение, и мобильный кадр показывает варианты srcset,',
  '  выбранные на 1440. Свежая загрузка на 390 даёт расхождение с эталоном',
  '  в четверть субпикселей — это другая процедура съёмки, а не регрессия.',
  'Выполнить ПРОКРУТКА ещё раз, снять оконный кадр 390×844 и полный кадр 390.',
];

function pngSize(path) {
  const buf = readFileSync(path);
  if (buf.length < 24) return null;
  return { ширина: buf.readUInt32BE(16), высота: buf.readUInt32BE(20) };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(sep).join('/'))) {
  const [, , cmd, one, two] = process.argv;
  if (cmd === 'protocol') {
    console.log('ПОРЯДОК СЪЁМКИ (MIGRATION.md §6, решения П9, П12, П16):');
    // Строки с отступом — продолжение предыдущего шага, номера им не полагается.
    let n = 0;
    for (const s of ПОРЯДОК) console.log(s.startsWith('  ') ? `    ${s.trim()}` : `${(n += 1)}. ${s}`);
    console.log('');
    console.log('СКРИПТ «ГОТОВНОСТЬ»:');
    console.log(ГОТОВНОСТЬ);
    console.log('');
    console.log('СКРИПТ «ПРОКРУТКА»:');
    console.log(ПРОКРУТКА);
    console.log('');
    console.log('СКРИПТ «К ПОЛОСЕ» (для оконного кадра при локализации), пример для y = 4200:');
    console.log(К_ПОЛОСЕ(4200));
  } else if (cmd === 'check' && one && two) {
    if (!existsSync(one) || !existsSync(two)) {
      console.error('нет папки с кадрами');
      process.exit(2);
    }
    const base = readdirSync(two).filter((f) => f.endsWith('.png')).sort();
    const got = new Set(readdirSync(one).filter((f) => f.endsWith('.png')));
    console.log(`эталонных кадров: ${base.length}, снятых: ${got.size}`);
    let missing = 0;
    for (const name of base) {
      if (!got.has(name)) {
        console.log(`  НЕТ      ${name}`);
        missing += 1;
        continue;
      }
      const a = pngSize(join(two, name));
      const b = pngSize(join(one, name));
      const same = a.ширина === b.ширина && a.высота === b.высота;
      console.log(
        `  ${same ? 'размер ок' : 'РАЗМЕР  '} ${name}: эталон ${a.ширина}×${a.высота}, снято ${b.ширина}×${b.высота}`
      );
      if (!same && a.ширина === b.ширина) {
        console.log('           высота разошлась — чаще всего не прокручен низ перед съёмкой (см. protocol)');
      }
    }
    if (missing) console.log(`не снято кадров: ${missing}`);
  } else {
    console.error('node core/accept/frames.mjs protocol');
    console.error('node core/accept/frames.mjs check <новые> <эталон>');
    process.exit(2);
  }
}
