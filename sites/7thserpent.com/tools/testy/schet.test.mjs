// Репортёр счёта `tools/schet-testov.mjs` и код прогона `kodProverki` — без сборки и без копии сайта
// (раунд 4 «судью судят» блока Б; прежние тесты счёта — в proverki.test.mjs, который собирает копию).
// Каждый тест — свой `node --test` во временной папке с репортёром счёта.
//   npm run proverki
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { kodProverki } from '../schet-testov.mjs';

const REPORTER = pathToFileURL(resolve(dirname(fileURLToPath(import.meta.url)), '../schet-testov.mjs')).href;
/** Окружение дочернего `node --test`: без метки «я подпроцесс прогона» внешнего `node --test`. */
const { NODE_TEST_CONTEXT, ...ENV } = process.env;

/** Прогон `node --test` с репортёром счёта по файлам `{ имя: текст }`: `{ kod, itog: { proshlo, upalo } }`. */
function progon(fajly, shablon = null) {
  const d = mkdtempSync(join(tmpdir(), 'schet-'));
  for (const [imya, tekst] of Object.entries(fajly)) writeFileSync(join(d, imya), tekst);
  const itog = join(d, 'itog.json');
  const r = spawnSync(process.execPath, ['--test', `--test-reporter=${REPORTER}`, `--test-reporter-destination=${itog}`, ...(shablon ? [`--test-name-pattern=${shablon}`] : []), ...Object.keys(fajly)], { cwd: d, env: ENV });
  return { kod: r.status, itog: JSON.parse(readFileSync(itog, 'utf8')) };
}
const schet = (tekst) => progon({ 'a.test.mjs': tekst }).itog;

const T = "import { test, describe, it } from 'node:test';\n";

/* — «судью судят», блок Б, раунд 4 (R4-B-*) — */

test('R4-B-K-4: набор, чьё тело падает само (не хук, детей нет), — в упавших', () => {
  assert.ok(schet(`${T}test('a', () => {});\ndescribe('g', async () => { await 0; throw new Error('x'); });\n`).upalo > 0);
});

test('R4-B-P-2: синхронный throw в теле describe без детей — в упавших', () => {
  assert.ok(schet(`${T}test('a', () => {});\ndescribe('g', () => { throw new Error('x'); });\n`).upalo > 0);
});

test('R4-B-Z-3: тело набора describe бросает (вложенный набор, детей нет) — в упавших, не «упало 0»', () => {
  assert.ok(schet(`${T}describe('g', () => { it('a', () => {}); describe('v', () => { throw new Error('telo'); }); });\n`).upalo > 0);
});

test('R4-B-Z-4: набор с упавшим ребёнком — упал один тест, набор не считается дважды', () => {
  // Краснота проверена мутантом: упавший набор считается при любой причине (строка пропуска снята) — упало 2.
  assert.deepEqual(schet(`${T}describe('g', () => { it('a', () => { throw new Error('x'); }); it('b', () => {}); });\n`), { proshlo: 1, upalo: 1 });
  // Упавший хук beforeEach: ребёнок hookFailed, набор subtestsFailed — одно падение.
  assert.deepEqual(schet(`${T}import { beforeEach } from 'node:test';\ndescribe('g', () => { beforeEach(() => { throw new Error('h'); }); it('a', () => {}); });\n`), { proshlo: 0, upalo: 1 });
});

const PROSHEL = `${T}test('a1', () => {});\n`;

test('R4-B-K-5: файл, вышедший process.exit(0) посреди тестов, — прогон не 0', () => {
  const r = progon({ 'a.test.mjs': PROSHEL, 'b.test.mjs': `${T}test('b1', () => {});\ntest('b2', () => { process.exit(0); });\ntest('b3', () => { throw new Error('x'); });\n` });
  assert.ok(r.itog.upalo > 0, JSON.stringify(r));
  assert.notEqual(kodProverki(r.kod, r.itog), 0);
});

test('R4-B-P-3: process.exit(0) на верхнем уровне файла после объявления падающего теста — прогон не 0', () => {
  const r = progon({ 'a.test.mjs': PROSHEL, 'e.test.mjs': `${T}test('e1', () => { throw new Error('x'); });\nprocess.exit(0);\n` });
  assert.ok(r.itog.upalo > 0, JSON.stringify(r));
  assert.notEqual(kodProverki(r.kod, r.itog), 0);
});

test('R4-B-K-5 (контроль правки): с шаблоном имён файл без совпавших тестов — не упал (B2-1); без шаблона — обычные файлы: прогон 0', () => {
  const r = progon({ 'a.test.mjs': PROSHEL, 'b.test.mjs': `${T}test('b1', () => {});\n` }, '^a1$');
  assert.deepEqual(r.itog, { proshlo: 1, upalo: 0 });
  assert.equal(kodProverki(r.kod, r.itog), 0);
  const bez = progon({ 'a.test.mjs': PROSHEL, 'b.test.mjs': `${T}describe('g', () => { it('b1', () => {}); });\ntest.todo('t');\n` });
  assert.deepEqual(bez.itog, { proshlo: 2, upalo: 0 });
  assert.equal(kodProverki(bez.kod, bez.itog), 0);
});

test.todo('R4-B-K-5 (предел): с шаблоном имён файл, вышедший process.exit(0) до событий своих тестов, неотличим от файла без совпавших тестов — пропуск, как в B2-1 (мягче)');
