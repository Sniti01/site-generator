// Раунд 4, блок Б: законные формы node:test, где код node 0, — не дают ли они «упало» по счёту (ложный код 1 kodProverki).
// node ozhidaemoe-padenie.mjs
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ZDES = dirname(fileURLToPath(import.meta.url));
const NYNE = 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/schet-testov.mjs';
const { kodProverki } = await import(NYNE);
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
const T = "import { test } from 'node:test';\n";
const sluchai = {
  'expectFailure: true, тело падает': T + "test('a', { expectFailure: true }, () => { throw new Error('x'); });\ntest('b', () => {});\n",
  't.skip() и потом падение': T + "test('a', (t) => { t.skip(); throw new Error('x'); });\ntest('b', () => {});\n",
  "t.todo('') и потом падение": T + "test('a', (t) => { t.todo(''); throw new Error('x'); });\ntest('b', () => {});\n",
  'skip: 0, тело проходит': T + "test('a', { skip: 0 }, () => {});\n",
  'todo в родителе, подтест падает': T + "test('a', { todo: true }, async (t) => { await t.test('a1', () => { throw new Error('x'); }); });\ntest('b', () => {});\n",
  'подтест с skip: null падает': T + "test('a', async (t) => { await t.test('a1', { skip: null }, () => { throw new Error('x'); }); });\ntest('b', () => {});\n",
};
for (const [imya, kod] of Object.entries(sluchai)) {
  const d = mkdtempSync(join(ZDES, 'ozh-'));
  writeFileSync(join(d, 'a.test.mjs'), kod);
  const itog = join(d, 'itog.json');
  const r = spawnSync(process.execPath, ['--test', `--test-reporter=${NYNE}`, `--test-reporter-destination=${itog}`, `--test-reporter=${pathToFileURL(join(ZDES, 'sobytiya.mjs')).href}`, '--test-reporter-destination=stdout', 'a.test.mjs'], { cwd: d, env: ENV, encoding: 'utf8' });
  const s = JSON.parse(readFileSync(itog, 'utf8'));
  console.log(`${imya}\n  счёт ${JSON.stringify(s)}, код node ${r.status}, kodProverki ${kodProverki(r.status ?? 2, s)}\n${r.stdout.split('\n').filter(Boolean).map((x) => '    ' + x).join('\n')}`);
}
