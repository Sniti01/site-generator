#!/usr/bin/env node
/**
 * Самопроверка инструментов приёмки.
 *
 *   node core/accept/selftest.mjs <папка сайта>
 *
 * Инструмент приёмки, которого никто не видел считающим правильно, —
 * обещание, а не проверка. Тот же довод, по которому у гейта структуры
 * есть `--selftest`.
 *
 * Проверка здесь особая: инструменты обязаны **воспроизвести числа, уже
 * записанные в отчётах прошлых сессий**. Числа взяты не из головы и не из
 * сегодняшнего прогона — они лежат в `docs/reports/` и в `MIGRATION.md` §6,
 * и если новый код даёт другие, разошлись либо код, либо сборка, и разбираться
 * надо до того, как инструментом начнут принимать выносы.
 *
 * Требуется собранный `dist/` сайта и снятый `_baseline/`.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { snapshot } from './manifest.mjs';
import { measure } from './css-triples.mjs';
import { decodePng, comparePixels } from './pixels.mjs';
import { normalizeScopes, flattenScopes, scopeLedger } from './html-diff.mjs';

const site = process.argv[2];
if (!site) {
  console.error('node core/accept/selftest.mjs <папка сайта>');
  process.exit(2);
}

const dist = join(site, 'dist');
const baseline = join(site, '_baseline');
if (!existsSync(dist)) {
  console.error(`нет сборки: ${dist} — самопроверке нужен свежий npm run build`);
  process.exit(2);
}

const cases = [];
const check = (имя, ждём, факт, откуда) =>
  cases.push({ имя, ждём, факт, откуда, ok: String(ждём) === String(факт) });

/* — манифест: 50 файлов, MIGRATION.md §6, подтверждение 1 — */
const snap = snapshot(dist);
check('файлов в dist/', 50, snap.файлов, 'MIGRATION.md §6, подтверждение 1');

/* — CSS: 331 правило и 24 @media-блока — */
const cssFiles = readdirSync(join(dist, '_astro')).filter((f) => f.endsWith('.css'));
check('файлов CSS в сборке', 1, cssFiles.length, 'отчёты P2: «index.html и единственный CSS»');
if (cssFiles.length === 1) {
  const m = measure(readFileSync(join(dist, '_astro', cssFiles[0]), 'utf8'));
  check('правил CSS', 331, m.правил, 'отчёты 2026-09-07-p2-header и -linkcolumns');
  check('@media-блоков', 26, m.media_вхождений, 'отчёт 2026-09-09-p3-storyrow: «24 → 26» после расщепления EraLayer');
}

/* — разметка: скруты находятся и приводятся к порядковому виду — */
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const { map, html: normalized } = normalizeScopes(html);
check('скрутов в index.html', true, map.size > 0, 'вынос меняет data-astro-cid-*, значит они там есть');
check('после приведения скрутов не осталось исходных', true, !/data-astro-cid-[a-z0-9]{6,}\b/.test(normalized), 'нормализация');

/* — пиксели: знаменатель и чувствительность в один субпиксель — */
if (existsSync(baseline)) {
  const hero = readdirSync(baseline).find((f) => f.includes('desktop-hero'));
  if (hero) {
    const img = decodePng(readFileSync(join(baseline, hero)));
    const same = comparePixels(img, img);
    check('субпикселей в кадре 1440×900', 3888000, same.субпикселей, 'отчёты P2: «1 из 3 888 000»');
    check('кадр против себя даёт ноль различий', 0, same.различных, 'здравый смысл сравнения');

    // Один инвертированный субпиксель обязан быть найден: копия отличается
    // ровно на единицу в первом канале первого пикселя.
    const twin = { ...img, data: Buffer.from(img.data) };
    twin.data[0] = twin.data[0] ^ 0xff;
    const one = comparePixels(img, twin);
    check('один инвертированный субпиксель найден', 1, one.различных, 'отчёт 2026-09-07-p2-cta: «ловит один из 3 888 000»');
    check('рамка различий сжалась до одного пикселя', '1×1', `${one.рамка.ширина}×${one.рамка.высота}`, 'рамка');
  }
} else {
  cases.push({ имя: 'пиксельные проверки', ждём: '_baseline/', факт: 'нет папки', откуда: '', ok: false, пропуск: true });
}

/* — плоское гашение: проверяются ИНВАРИАНТЫ режима, а не сегодняшние числа —
   Числа сборки для этой пары проверок не годятся: они меняются каждым
   расщеплением, а константа, которую двигают руками, ничего не проверяет.
   Поэтому здесь два утверждения, верных при любой сборке. */
{
  const образец = '<p class="a" data-astro-cid-abc12345>текст</p><i data-astro-cid-abc12345>i</i>';
  const { html: погашено, скрутов } = flattenScopes(образец);
  // Сравниваем с образцом, у которого заменён ТОЛЬКО хеш: если гашение тронет
  // хоть один другой байт, равенство не выполнится.
  check(
    'гашение стирает только хеш',
    true,
    погашено === образец.replaceAll('abc12345', '@'),
    'REUSE §6: «стирает только хеш и ничего больше»'
  );
  check('гашение считает различные скруты', 1, скрутов, 'счёт — компенсация за потерю различий');

  // Модель расщепления: один скрут файла становится тремя, причём скрут
  // обёртки уцелевает — он выводится из пути, а обёртка пути не меняет.
  const до = '<a data-astro-cid-aaaaaaaa></a><b data-astro-cid-aaaaaaaa></b><c data-astro-cid-aaaaaaaa></c>';
  const после = '<a data-astro-cid-aaaaaaaa></a><b data-astro-cid-bbbbbbbb></b><c data-astro-cid-cccccccc></c>';
  const л = scopeLedger(до, после);
  check('расщепление: скрутов 1 → 3', '1→3', `${л.до}→${л.после}`, 'REUSE §6, требование владельца П30 п.1');
  check('расщепление: скрут обёртки уцелел', 1, л.уцелели.length, 'скрут выводится из пути файла, а не из содержимого');
  check('расщепление: новых скрутов ровно два', 2, л.новые.length, 'иное число — остановка и разбор');
  check('расщепление: не исчез ни один', 0, л.ушли.length, 'исчезнувший скрут означает переезд файла, а не расщепление');
}

/* — вывод — */
let failed = 0;
for (const c of cases) {
  if (!c.ok && !c.пропуск) failed += 1;
  const mark = c.пропуск ? 'нет ' : c.ok ? 'ok  ' : 'ЗЛЕ ';
  console.log(`${mark} ${String(c.имя).padEnd(44)} ждём ${String(c.ждём).padEnd(9)} факт ${String(c.факт).padEnd(9)} ${c.откуда}`);
}
console.log('');
console.log(`${cases.filter((c) => c.ok).length}/${cases.length} чисел воспроизведены из записей прошлых сессий`);
if (failed) {
  console.error('');
  console.error('Расхождение с записью. Разошлись либо инструмент, либо сборка — разбираться до того,');
  console.error('как этим инструментом начнут принимать выносы.');
  process.exit(1);
}
