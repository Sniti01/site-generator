// B3-5: skip/todo, падение уровня файла, код kodProverki — новые члены класса; счёт репортёром репозитория.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { kodProverki } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/schet-testov.mjs';

const TUT = dirname(fileURLToPath(import.meta.url));
const REP = 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/schet-testov.mjs';
const I = "import { describe, it, test } from 'node:test';\n";
const sluchai = {
  'R4-B-Z-6: t.skip() и потом падение': I + "test('a', (t) => { t.skip(); throw new Error('x'); });\ntest('b', () => {});\n",
  "R4-B-Z-6: { skip: '' } с упавшим телом": I + "test('a', { skip: '' }, () => { throw new Error('x'); });\ntest('b', () => {});\n",
  "новый: describe { skip: '' } — дети": I + "describe('g', { skip: '' }, () => { it('a', () => { throw new Error('x'); }); it('b', () => {}); });\n",
  'новый: { skip: false } — обычный тест': I + "test('a', { skip: false }, () => {});\n",
  'новый: { todo: false } и падение — упал': I + "test('a', { todo: false }, () => { throw new Error('x'); });\ntest('b', () => {});\n",
  "новый: t.skip('') во вложенном подтесте, потом падение": I + "test('a', async (t) => { await t.test('a1', (tt) => { tt.skip(''); throw new Error('x'); }); });\n",
  "новый: { skip: '' } async отвергнуто": I + "test('a', { skip: '' }, async () => { await Promise.reject(new Error('x')); });\ntest('b', () => {});\n",
  'новый: файл бросает после регистрации теста': I + "test('a', () => {});\nthrow new Error('verh');\n",
  'новый: необработанный отказ после тестов': I + "test('a', () => {});\nsetTimeout(() => Promise.reject(new Error('pozdno')), 10);\n",
  'новый: process.exit(0) посреди': I + "test('a', () => {});\ntest('b', () => { process.exit(0); });\ntest('c', () => { throw new Error('ne dojdet'); });\n",
  'новый: t.todo() и падение — не упал': I + "test('a', (t) => { t.todo(); throw new Error('x'); });\ntest('b', () => {});\n",
  'новый: { todo: 0 } и падение': I + "test('a', { todo: 0 }, () => { throw new Error('x'); });\ntest('b', () => {});\n",
};
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
for (const [ime, kod] of Object.entries(sluchai)) {
  const d = mkdtempSync(join(TUT, 'q-'));
  writeFileSync(join(d, 'a.test.mjs'), kod);
  const itog = join(d, 'itog.json');
  const r = spawnSync(process.execPath, ['--test', `--test-reporter=${REP}`, `--test-reporter-destination=${itog}`, 'a.test.mjs'], { cwd: d, env: ENV });
  let s;
  try {
    s = JSON.parse(readFileSync(itog, 'utf8'));
  } catch {
    s = null;
  }
  const ev = spawnSync(process.execPath, ['--test', `--test-reporter=${pathToFileURL(join(TUT, 'r-sobytiya.mjs')).href}`, 'a.test.mjs'], { cwd: d, env: ENV, encoding: 'utf8' }).stdout.trim();
  console.log(`— ${ime}: счёт ${JSON.stringify(s)}, код node ${r.status}, kodProverki ${s ? kodProverki(r.status ?? 2, s) : '—'}\n   ${ev.split('\n').join('\n   ')}`);
}
