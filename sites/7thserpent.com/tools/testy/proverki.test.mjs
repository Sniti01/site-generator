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
import { SAYT } from '../kopiya.mjs';

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

test('B2-1: шаблон имён ни с чем не совпал — proverki даёт код 2', () => {
  const r = spawnSync(process.execPath, [join(SAYT, 'tools/proverki.mjs'), '--test-name-pattern=^B2-1 никогда не совпадёт$'], {
    cwd: SAYT,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    env: { ...ENV, FORCE_COLOR: '0', NO_COLOR: '1' },
  });
  assert.equal(r.status, 2, `${r.stdout.slice(-1500)}\n${r.stderr.slice(-1500)}`);
  assert.match(r.stderr, /прошедших тестов ноль/);
});

test.todo('B2-9 (предел проверки): Ctrl+C между фазами proverki — прерывание с уборкой копии; на Windows сигнал пробой не послать (process.kill — TerminateProcess)');
