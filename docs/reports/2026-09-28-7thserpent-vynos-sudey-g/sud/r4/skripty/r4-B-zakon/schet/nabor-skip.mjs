// Раунд 4, блок Б: набор describe с skip '' / null и бросающим телом; набор, где тело бросает после регистрации детей,
// и вложенный набор, чьё тело бросает, — счёт нынешнего репортёра, код node и kodProverki.
// node nabor-skip.mjs
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ZDES = dirname(fileURLToPath(import.meta.url));
const NYNE = 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/schet-testov.mjs';
const { kodProverki } = await import(NYNE);
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
const D = "import { describe, it } from 'node:test';\n";
const sluchai = {
  "describe skip '' — тело бросает, детей нет": D + "describe('g', { skip: '' }, () => { throw new Error('telo'); });\ndescribe('h', () => { it('ok', () => {}); });\n",
  'describe skip null — тело бросает, детей нет': D + "describe('g', { skip: null }, () => { throw new Error('telo'); });\ndescribe('h', () => { it('ok', () => {}); });\n",
  "describe skip '' — ребёнок падает": D + "describe('g', { skip: '' }, () => { it('a', () => { throw new Error('x'); }); });\ndescribe('h', () => { it('ok', () => {}); });\n",
  'вложенный describe — тело бросает (в соседях зелёный тест)': D + "describe('g', () => { it('a', () => {}); describe('v', () => { throw new Error('telo'); }); });\n",
};
for (const [imya, kod] of Object.entries(sluchai)) {
  const d = mkdtempSync(join(ZDES, 'nabor-'));
  writeFileSync(join(d, 'a.test.mjs'), kod);
  const itog = join(d, 'itog.json');
  const r = spawnSync(process.execPath, ['--test', `--test-reporter=${NYNE}`, `--test-reporter-destination=${itog}`, `--test-reporter=${pathToFileURL(join(ZDES, 'sobytiya.mjs')).href}`, '--test-reporter-destination=stdout', 'a.test.mjs'], { cwd: d, env: ENV, encoding: 'utf8' });
  const s = JSON.parse(readFileSync(itog, 'utf8'));
  console.log(`${imya}\n  счёт ${JSON.stringify(s)}, код node ${r.status}, kodProverki ${kodProverki(r.status ?? 2, s)}\n${r.stdout.split('\n').filter(Boolean).map((x) => '    ' + x).join('\n')}`);
}
