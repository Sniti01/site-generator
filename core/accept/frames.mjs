#!/usr/bin/env node
/**
 * Приёмка: съёмка кадров по протоколу и проверка снятого набора.
 *
 *   node core/accept/frames.mjs protocol            — печатает порядок съёмки и скрипты страницы
 *   node core/accept/frames.mjs check <новые> <эталон>  — сверяет состав, размеры набора и геометрию
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
 *
 * **Кадры слоёв наводятся по якорю, а сдвиг сверху ловится числом** —
 * П39 (новая редакция П30 п.2), исполнено 2026-09-11 пунктом 14 бэклога.
 * До того прокрутка шла к литералу `scrollY`, и любая правка высоты выше
 * слоя убивала кадр: под литералом оказывалось другое содержание. Теперь
 * `К_ЯКОРЮ` центрирует слой в окне по его `id`, а `ГЕОМЕТРИЯ` снимает
 * высоту страницы и `offsetTop` каждого слоя; `check` сверяет их
 * с `geometria.json` эталона и называет сдвиг отдельной строкой.
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
 *
 * **Ступенями, а не одним прыжком.** Ленивое изображение грузится, когда
 * попадает в поле зрения; мгновенный прыжок вниз и обратно середину страницы
 * не показывает. Измерено 2026-09-09 на 1440×900: один прыжок будит 3 из 11
 * изображений, ступени по 0,9 высоты окна — 11 из 11. Цена пропуска — полный
 * кадр расходится с эталоном на 2 131 290 субпикселей из 38 098 080.
 */
// `'instant'`, а не `'auto'`: по спецификации `'auto'` значит «как велит CSS»,
// а `src/styles/global.css` ставит `html { scroll-behavior: smooth }`.
export const ПРОКРУТКА = `const шаг = Math.round(window.innerHeight * 0.9);
for (let y = 0; y <= document.body.scrollHeight; y += шаг) {
  window.scrollTo({ top: y, behavior: 'instant' });
  await new Promise(r => setTimeout(r, 60));
}
window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });
await new Promise(r => setTimeout(r, 400));
window.scrollTo({ top: 0, behavior: 'instant' });
await new Promise(r => setTimeout(r, 200));
({ высота: document.body.scrollHeight, scrollY: window.scrollY })`;

/**
 * Прокрутка к кадру слоя — **по якорю**, не к числу (П39). Слой центрируется
 * в окне той же формулой, которой 2026-09-09 были получены литералы:
 * `offsetTop + round((высота слоя − высота окна) / 2)`. Разница в том, что
 * числа берутся с живой страницы, а не из таблицы, — поэтому кадр остаётся
 * сравнимым, что бы ни выросло выше слоя. Сдвиг сверху при этом не теряется:
 * скрипт возвращает `offsetTop` и высоту страницы, и `check` сверяет их
 * с записанными (`ГЕОМЕТРИЯ`, `geometria.json`).
 *
 * Отсутствие якоря — отказ, не «встало где-то»: кадр без своего слоя —
 * не кадр этого слоя.
 */
export const К_ЯКОРЮ = (id) => `const слой = document.getElementById(${JSON.stringify(id)});
if (!слой) throw new Error('нет якоря #' + ${JSON.stringify(id)});
const рамка = слой.getBoundingClientRect();
const offsetTop = Math.round((рамка.top + window.scrollY) * 100) / 100;
const высота = Math.round(рамка.height * 100) / 100;
const y = Math.round(offsetTop + (высота - window.innerHeight) / 2);
window.scrollTo({ top: y, behavior: 'instant' });
await new Promise(r => setTimeout(r, 200));
({ якорь: ${JSON.stringify(id)}, offsetTop, высота, ожидали: y, scrollY: window.scrollY, высотаСтраницы: document.body.scrollHeight })`;

/**
 * Геометрия страницы для сверки числом: высота страницы и положение каждого
 * слоя по якорю. Снимается при `scrollY = 0` после `ПРОКРУТКА`, когда все
 * изображения заняли место. Результат для каждого вьюпорта складывается
 * в `geometria.json` рядом с кадрами — той же формы, что у эталона.
 */
export const ГЕОМЕТРИЯ = (ids) => `({
  вьюпорт: { w: window.innerWidth, h: window.innerHeight },
  высота: document.body.scrollHeight,
  слои: Object.fromEntries(${JSON.stringify(ids)}.map(id => {
    const el = document.getElementById(id);
    if (!el) return [id, null];
    const r = el.getBoundingClientRect();
    return [id, { offsetTop: Math.round((r.top + window.scrollY) * 100) / 100, высота: Math.round(r.height * 100) / 100 }];
  }))
})`;

/**
 * Сверка геометрии: эталонная против снятой, обе — `{ '<ширина>': { высота,
 * слои: { <якорь>: { offsetTop, высота } } } }`. Возвращает список сдвигов;
 * пустой список — геометрия совпала. Чистая функция: её проверяет
 * самопроверка.
 *
 * Слой, которого нет в снятом (`null` или отсутствие ключа), — сдвиг
 * с пометкой «нет якоря»: молчать про пропавший слой нельзя, это тот же
 * класс, что неработающий судья.
 */
export function сравнитьГеометрию(эталон, снятое) {
  const сдвиги = [];
  const ширины = Object.keys(эталон).filter((k) => /^\d+$/.test(k));
  for (const w of ширины) {
    const э = эталон[w];
    const с = снятое?.[w];
    if (!с) {
      сдвиги.push({ что: `высота ${w}`, эталон: э.высота, снято: null, сдвиг: null });
      continue;
    }
    if (э.высота !== с.высота) {
      сдвиги.push({ что: `высота ${w}`, эталон: э.высота, снято: с.высота, сдвиг: с.высота - э.высота });
    }
    for (const [якорь, эс] of Object.entries(э.слои ?? {})) {
      const сс = с.слои?.[якорь] ?? null;
      if (!сс) {
        сдвиги.push({ что: `${w} #${якорь}`, эталон: эс.offsetTop, снято: null, сдвиг: null });
        continue;
      }
      if (эс.offsetTop !== сс.offsetTop) {
        сдвиги.push({ что: `${w} #${якорь} offsetTop`, эталон: эс.offsetTop, снято: сс.offsetTop, сдвиг: сс.offsetTop - эс.offsetTop });
      }
      if (эс.высота !== сс.высота) {
        сдвиги.push({ что: `${w} #${якорь} высота`, эталон: эс.высота, снято: сс.высота, сдвиг: сс.высота - эс.высота });
      }
    }
  }
  return сдвиги;
}

const ПОРЯДОК = [
  'Собрать сайт и поднять прод-превью: npm run build && npm run preview (не dev-сервер:',
  '  в dev Astro включает annotateSourceFile и dev-toolbar, и разметка заведомо не равна прод-сборке).',
  'Открыть страницу с вьюпортом 1440×900.',
  'Выполнить скрипт ГОТОВНОСТЬ, дождаться ответа.',
  'Выполнить скрипт ПРОКРУТКА — до низа и обратно.',
  'Выполнить скрипт ГЕОМЕТРИЯ с якорями слоёв из geometria.json эталона; записать ответ.',
  'Снять оконный кадр 1440×900 и полностраничный кадр 1440.',
  'Для каждого слоя: К_ЯКОРЮ(id), сверить scrollY с ожидаемым, дать осесть переходам',
  '  (700 мс и два requestAnimationFrame), снять оконный кадр 1440×900.',
  'Сменить вьюпорт на 390×844 БЕЗ перезагрузки: браузер не понижает уже',
  '  загруженное изображение, и мобильный кадр показывает варианты srcset,',
  '  выбранные на 1440. Свежая загрузка на 390 даёт расхождение с эталоном',
  '  в четверть субпикселей — это другая процедура съёмки, а не регрессия.',
  'Выполнить ПРОКРУТКА и ГЕОМЕТРИЯ ещё раз, снять оконный кадр 390×844 и полный кадр 390.',
  'Сложить обе геометрии в geometria.json рядом с кадрами: { "1440": …, "390": … }.',
];

function pngSize(path) {
  const buf = readFileSync(path);
  if (buf.length < 24) return null;
  return { ширина: buf.readUInt32BE(16), высота: buf.readUInt32BE(20) };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split(sep).join('/'))) {
  const [, , cmd, one, two] = process.argv;
  if (cmd === 'protocol') {
    console.log('ПОРЯДОК СЪЁМКИ (MIGRATION.md §6, решения П9, П12, П16, П39):');
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
    console.log('СКРИПТ «ГЕОМЕТРИЯ» (высота страницы и слои по якорю), пример для двух якорей:');
    console.log(ГЕОМЕТРИЯ(['epoka-jerozolima', 'epoka-wlochy']));
    console.log('');
    console.log('СКРИПТ «К ЯКОРЮ» (оконный кадр слоя, П39), пример для #epoka-jerozolima:');
    console.log(К_ЯКОРЮ('epoka-jerozolima'));
  } else if (cmd === 'check' && one && two) {
    if (!existsSync(one) || !existsSync(two)) {
      console.error('нет папки с кадрами');
      process.exit(2);
    }
    const base = readdirSync(two).filter((f) => f.endsWith('.png')).sort();
    const got = new Set(readdirSync(one).filter((f) => f.endsWith('.png')));
    console.log(`эталонных кадров: ${base.length}, снятых: ${got.size}`);

    // Число неработающих судей печатается ОТДЕЛЬНОЙ СТРОКОЙ при каждой сверке.
    // Решение владельца 2026-09-09: молчание про неработающего судью равно
    // красному `accept`, которого три сессии никто не видел. Список ведётся
    // в `_baseline/ne-sudyi.json` и обнуляется вместе с кадрами.
    const списокПуть = join(two, 'ne-sudyi.json');
    if (existsSync(списокПуть)) {
      const список = JSON.parse(readFileSync(списокПуть, 'utf8'));
      const н = (список.кадры ?? []).length;
      console.log(`НЕ СУДЬИ: ${н} из ${base.length} — сверка против них ничего не значит.`);
      for (const к of список.кадры ?? []) console.log(`  ${к.кадр}: ${к.причина} (с ${к.перестал})`);
    } else {
      console.log('НЕ СУДЬИ: списка ne-sudyi.json нет — считается, что судьи все.');
    }

    // Сдвиг сверху называется ЧИСЛОМ, а не взрывом кадра (П39). Эталон несёт
    // `geometria.json`; съёмка кладёт такой же рядом с кадрами. Нет одного
    // из двух — сказать об этом громко: молчание тут равно непроверенному
    // сдвигу, а кадр слоя, наведённый по якорю, сдвиг сам не покажет.
    const геоЭталон = join(two, 'geometria.json');
    const геоСнятое = join(one, 'geometria.json');
    if (!existsSync(геоЭталон)) {
      console.log('ГЕОМЕТРИЯ: у эталона нет geometria.json — сдвиг сверху числом не сверяется.');
    } else if (!existsSync(геоСнятое)) {
      console.log('ГЕОМЕТРИЯ: рядом со снятыми кадрами нет geometria.json — сдвиг сверху числом НЕ НАЗВАН.');
    } else {
      const сдвиги = сравнитьГеометрию(
        JSON.parse(readFileSync(геоЭталон, 'utf8')),
        JSON.parse(readFileSync(геоСнятое, 'utf8'))
      );
      if (!сдвиги.length) console.log('ГЕОМЕТРИЯ: совпала — высоты страниц и положение слоёв те же.');
      else {
        console.log(`ГЕОМЕТРИЯ: сдвигов ${сдвиги.length} — кадры слоёв наведены по якорю, но выше них что-то изменилось:`);
        for (const с of сдвиги) {
          const знак = с.сдвиг === null ? 'нет якоря' : `${с.сдвиг > 0 ? '+' : ''}${с.сдвиг}`;
          console.log(`  СДВИГ  ${с.что}: эталон ${с.эталон}, снято ${с.снято ?? '—'} (${знак})`);
        }
      }
    }

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
