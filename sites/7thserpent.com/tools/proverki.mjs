#!/usr/bin/env node
/**
 * ОДНА ОБЯЗАТЕЛЬНАЯ КОМАНДА ВНЕ СБОРКИ — `npm run proverki` (П102: «пробы и тесты, которые сами
 * собирают сайт, — одной обязательной командой вне сборки»).
 *
 *   1. Копия сайта во временной папке вне репозитория (`tools/kopiya.mjs`) и её сборка — `astro build`
 *      со сторожами сборки (судьи `dist/` судят и копию); сборка копии не прошла — отказ, тесты
 *      не идут.
 *   2. `node --test` — тесты судей ядра (`core/text/`, `core/gates/`) и сайта (`tools/**\/*.test.mjs`);
 *      тестам, которым нужна сборка, путь к `dist/` копии — в `PROVERKI_DIST`. Пробы схемы
 *      и маршрута — тесты, которые собирают свои копии сами.
 *   3. Копия удаляется (`--ostavit` — оставить, отметить и напечатать путь; уборка старых копий
 *      оставленную не трогает, B2-4).
 *
 * Код выхода — `kodProverki` (`tools/schet-testov.mjs`) по коду `node --test` и счёту: ненулевой код
 * node — как есть; код node 0 при упавших по счёту (`skip: ''` с выполненным упавшим телом, B3-5;
 * файл, вышедший `process.exit(0)` посреди тестов, R4-B-K-5) — 1; 0 — все тесты прошли; 2 — копия
 * не снялась или не собралась, ошибка входа, итога счёта нет или ноль прошедших тестов (шаблон
 * `--test-name-pattern` ни с чем не совпал — «прошло» о пустом наборе не выдаётся; раунды 1–4
 * «судью судят» блока Б, B1-G-11, B2-1, R4-B-Z-6: счёт — репортёром по событиям тестов, не разбором
 * TAP); 130 — Ctrl+C.
 * Файлы сайта на месте не правятся ничем. Ctrl+C: во время сборки или тестов прерывается дочерний
 * процесс; между фазами прогон уступает циклу событий и видит флаг обработчика (B2-9) — копия
 * убирается; копии прогонов, прерванных иначе, убираются на старте следующего (старше 12 часов,
 * по метке копии — `tools/kopiya.mjs`). Запуск — `node tools/proverki.mjs` (П102: пробы — только
 * node; под `npm run` Ctrl+C сначала завершает npm).
 */

import { readdirSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { sdelatKopiyu, sobrat, udalitKopiyu, ubratStaryeKopii, SAYT, REPO, OSTAVLENA } from './kopiya.mjs';
import { kodProverki } from './schet-testov.mjs';

const argi = process.argv.slice(2);
const lishnie = argi.filter((a) => !['--ostavit'].includes(a) && !a.startsWith('--test-name-pattern='));
if (lishnie.length) {
  console.error(`неизвестные аргументы: ${lishnie.join(' ')} — есть --ostavit и --test-name-pattern=<шаблон>`);
  process.exit(2);
}

const obhod = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === 'node_modules' ? [] : obhod(join(d, e.name))) : [join(d, e.name)]));
const testy = [
  ...['core/text', 'core/gates'].flatMap((p) => (existsSync(join(REPO, p)) ? obhod(join(REPO, p)) : [])),
  ...obhod(join(SAYT, 'tools')),
].filter((f) => f.endsWith('.test.mjs'));
if (!testy.length) {
  console.error('тестов нет — «всё прошло» о пустом наборе не выдаётся');
  process.exit(2);
}

for (const p of ubratStaryeKopii()) console.log(`убрана копия прерванного прогона: ${p}`);

// Ctrl+C: обработчик ставит флаг; между фазами прогон уступает циклу событий (иначе синхронный
// прогон флага не увидит — B2-9) и прерывается с уборкой копии, кодом 130.
let prervano = false;
process.on('SIGINT', () => {
  prervano = true;
});
const ustupit = () => new Promise((r) => setImmediate(r));

let k;
try {
  k = sdelatKopiyu(mkdtempSync(join(tmpdir(), 'proverki-')));
} catch (e) {
  console.error(`копия сайта не снялась: ${e.message}`);
  process.exit(2);
}
let kod = 2;
const itogFajl = join(k.koren, 'itog-testov.json');
try {
  await ustupit();
  if (prervano) throw Object.assign(new Error('прервано'), { prervano: true });
  console.log(`копия сайта: ${k.sayt}`);
  const t0 = Date.now();
  const s = sobrat(k);
  await ustupit();
  if (prervano) throw Object.assign(new Error('прервано'), { prervano: true });
  if (s.kod !== 0) {
    console.error(s.vyvod.split('\n').slice(-40).join('\n'));
    console.error(`\nсборка копии не прошла (код ${s.kod}) — тесты не запускаются`);
  } else {
    console.log(`сборка копии: ${Math.round((Date.now() - t0) / 1000)} с; тестов-файлов ${testy.length}`);
    // Дочерний `node --test` — без метки «я подпроцесс прогона» (если сам proverki запущен из теста).
    const { NODE_TEST_CONTEXT, ...env } = process.env;
    const r = spawnSync(
      process.execPath,
      [
        '--test',
        '--test-reporter=spec',
        '--test-reporter-destination=stdout',
        `--test-reporter=${pathToFileURL(join(SAYT, 'tools/schet-testov.mjs')).href}`,
        `--test-reporter-destination=${itogFajl}`,
        ...argi.filter((a) => a.startsWith('--test-name-pattern=')),
        ...testy.map((f) => relative(SAYT, f)),
      ],
      { cwd: SAYT, stdio: 'inherit', env: { ...env, PROVERKI_DIST: join(k.sayt, 'dist') } }
    );
    await ustupit();
    if (prervano) throw Object.assign(new Error('прервано'), { prervano: true });
    // Счёт — своим репортёром по событиям тестов (B2-1, B3-4, B3-5); код — по коду node и по счёту.
    const itog = existsSync(itogFajl) ? JSON.parse(readFileSync(itogFajl, 'utf8')) : null;
    if (!itog) {
      console.error('итога счёта тестов нет — «всё прошло» не выдаётся');
      kod = 2;
    } else {
      console.log(`тестов: прошло ${itog.proshlo}, упало ${itog.upalo}`);
      kod = kodProverki(r.status ?? 2, itog);
      if (kod === 2 && r.status === 0) console.error('прошедших тестов ноль — «всё прошло» о пустом наборе не выдаётся (шаблон имён ни с чем не совпал?)');
      if (kod === 1 && r.status === 0) console.error('node --test вышел с 0, а упавшие по счёту есть (skip с выполненным телом или выход файла тестов process.exit(0) посреди тестов?) — прогон не прошёл');
    }
  }
} catch (e) {
  if (!e.prervano) throw e;
  console.error('\nпрервано (Ctrl+C) — копия убирается');
  kod = 130;
} finally {
  rmSync(itogFajl, { force: true });
  if (argi.includes('--ostavit') && !prervano) {
    // Оставленная копия отмечена: уборка старых копий её не тронет (B2-4); удалять — udalitKopiyu.
    writeFileSync(join(k.koren, OSTAVLENA), 'оставлена по --ostavit\n');
    console.log(`копия оставлена: ${k.koren} (удалять только udalitKopiyu из tools/kopiya.mjs: в ней ссылки-переходы на живое дерево)`);
  } else udalitKopiyu(k);
}
process.exit(kod);
