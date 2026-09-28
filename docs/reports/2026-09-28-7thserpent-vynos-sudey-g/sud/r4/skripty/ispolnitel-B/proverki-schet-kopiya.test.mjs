// Одна команда вне сборки (`tools/proverki.mjs`) — счёт прошедших тестов (раунд 2 «судью судят» блока Б,
// B2-1): «прошло» о пустом наборе не выдаётся. Node 26 ставит «ok» каждому файлу, где шаблон имён не оставил
// тестов, а строка вывода теста «pass 5» попадает в TAP как «# pass 5» — счёт идёт своим репортёром
// (`tools/schet-testov.mjs`) по событиям настоящих тестов.
//   npm run proverki
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { SAYT } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/kopiya.mjs';

const REPORTER = pathToFileURL(join(SAYT, 'tools/schet-testov.mjs')).href;
/** Окружение дочернего `node --test`: без метки «я подпроцесс прогона» внешнего `node --test`. */
const { NODE_TEST_CONTEXT, ...ENV } = process.env;

/** Прогон `node --test` с репортёром счёта на файле `a.test.mjs`: `{ proshlo, upalo }`. */
function schet(kod, shablon) {
  const d = mkdtempSync(join(tmpdir(), 'schet-'));
  writeFileSync(join(d, 'a.test.mjs'), kod);
  const itog = join(d, 'itog.json');
  spawnSync(process.execPath, ['--test', `--test-reporter=${REPORTER}`, `--test-reporter-destination=${itog}`, ...(shablon ? [`--test-name-pattern=${shablon}`] : []), 'a.test.mjs'], { cwd: d, env: ENV });
  return JSON.parse(readFileSync(itog, 'utf8'));
}

test('B2-1: «pass N» из вывода теста и «ok <файл>» файла без тестов — не прошедшие тесты', () => {
  const kod = "import { test } from 'node:test';\nconsole.log('pass 5');\ntest('t', () => {});\ntest.todo('d');\n";
  assert.equal(schet(kod, '^никогда$').proshlo, 0);
  assert.deepEqual(schet(kod, null), { proshlo: 1, upalo: 0 });
});

test('B2-1: упавший тест — упал; подтест — свой счёт', () => {
  const kod = "import { test } from 'node:test';\nimport assert from 'node:assert';\ntest('a', async (t) => { await t.test('a1', () => {}); });\ntest('b', () => assert.fail('x'));\n";
  assert.deepEqual(schet(kod, null), { proshlo: 2, upalo: 1 });
});

test('B3-4: набор describe — не тест: пустой набор и набор из одних пропущенных — прошло 0; набор из двух тестов — 2', () => {
  assert.deepEqual(schet("import { describe, it } from 'node:test';\ndescribe('pusto', () => {});\ndescribe('g', () => { it.skip('s', () => {}); it.todo('t'); });\n", null), { proshlo: 0, upalo: 0 });
  assert.deepEqual(schet("import { describe, it } from 'node:test';\ndescribe('g', () => { it('a', () => {}); it('b', () => {}); });\n", null), { proshlo: 2, upalo: 0 });
});

test('B3-4 (контроль правки): упавший хук набора — в упавших', () => {
  assert.ok(schet("import { describe, it, after } from 'node:test';\ndescribe('g', () => { after(() => { throw new Error('a'); }); it('ok', () => {}); });\n", null).upalo > 0);
});

test('B3-5: падение вне тестов (файл не импортируется) — в упавших, не «упало 0»', () => {
  assert.ok(schet("import './net-takogo-fajla.mjs';\n", null).upalo > 0);
});

test("B3-5: skip/todo — по наличию поля: skip '' с упавшим телом — упало; t.skip('') — не прошло; todo '' — не упало", () => {
  assert.deepEqual(
    schet("import { test } from 'node:test';\ntest('x', { skip: '' }, () => { throw new Error('telo'); });\ntest('y', (t) => { t.skip(''); });\ntest('z', { todo: '' }, () => { throw new Error('t'); });\n", null),
    { proshlo: 0, upalo: 1 }
  );
});

test('B3-5: код proverki — упавшие по счёту при коде node 0 дают не 0', async () => {
  const { kodProverki } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/schet-testov.mjs');
  assert.equal(typeof kodProverki, 'function', 'нет решения о коде по счёту');
  assert.notEqual(kodProverki(0, { proshlo: 5, upalo: 1 }), 0);
  assert.equal(kodProverki(0, { proshlo: 0, upalo: 0 }), 2);
  assert.equal(kodProverki(0, { proshlo: 3, upalo: 0 }), 0);
  assert.equal(kodProverki(1, { proshlo: 3, upalo: 0 }), 1);
});

test.todo('B2-9 (предел проверки): Ctrl+C между фазами proverki — прерывание с уборкой копии; на Windows сигнал пробой не послать (process.kill — TerminateProcess)');
