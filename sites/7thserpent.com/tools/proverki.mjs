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
 *   3. Копия удаляется (`--ostavit` — оставить и напечатать путь).
 *
 * Код выхода — код `node --test` (0 — все тесты прошли), 2 — копия не снялась или не собралась,
 * ошибка входа или ноль прошедших тестов (шаблон `--test-name-pattern` ни с чем не совпал —
 * «прошло» о пустом наборе не выдаётся; раунд 1 «судью судят» блока Б, B1-G-11).
 * Файлы сайта на месте не правятся ничем. Ctrl+C: дочерний `node --test` прерывается, копия
 * убирается (обработчик SIGINT не даёт процессу умереть до `finally`); копии прогонов, прерванных
 * иначе, убираются на старте следующего (старше 12 часов, по метке копии — `tools/kopiya.mjs`).
 */

import { readdirSync, existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { tmpdir } from 'node:os';
import { sdelatKopiyu, sobrat, udalitKopiyu, ubratStaryeKopii, SAYT, REPO } from './kopiya.mjs';

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
process.on('SIGINT', () => console.error('\nпрервано — копия убирается'));

let k;
try {
  k = sdelatKopiyu(mkdtempSync(join(tmpdir(), 'proverki-')));
} catch (e) {
  console.error(`копия сайта не снялась: ${e.message}`);
  process.exit(2);
}
let kod = 2;
const tap = join(k.koren, 'itog.tap');
try {
  console.log(`копия сайта: ${k.sayt}`);
  const t0 = Date.now();
  const s = sobrat(k);
  if (s.kod !== 0) {
    console.error(s.vyvod.split('\n').slice(-40).join('\n'));
    console.error(`\nсборка копии не прошла (код ${s.kod}) — тесты не запускаются`);
  } else {
    console.log(`сборка копии: ${Math.round((Date.now() - t0) / 1000)} с; тестов-файлов ${testy.length}`);
    const r = spawnSync(
      process.execPath,
      [
        '--test',
        '--test-reporter=spec',
        '--test-reporter-destination=stdout',
        '--test-reporter=tap',
        `--test-reporter-destination=${tap}`,
        ...argi.filter((a) => a.startsWith('--test-name-pattern=')),
        ...testy.map((f) => relative(SAYT, f)),
      ],
      { cwd: SAYT, stdio: 'inherit', env: { ...process.env, PROVERKI_DIST: join(k.sayt, 'dist') } }
    );
    kod = r.status ?? 2;
    const itog = existsSync(tap) ? readFileSync(tap, 'utf8') : '';
    const proshlo = Number(/^# pass (\d+)$/m.exec(itog)?.[1] ?? 0);
    if (kod === 0 && proshlo === 0) {
      console.error('прошедших тестов ноль — «всё прошло» о пустом наборе не выдаётся (шаблон имён ни с чем не совпал?)');
      kod = 2;
    }
  }
} finally {
  rmSync(tap, { force: true });
  if (argi.includes('--ostavit')) console.log(`копия оставлена: ${k.koren}`);
  else udalitKopiyu(k);
}
process.exit(kod);
