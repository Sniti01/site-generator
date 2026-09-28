// Счёт репортёрами (нынешний из репозитория, прежний, правка скептика, мутант «набор всегда упал») на перечне файлов тестов.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const TUT = dirname(fileURLToPath(import.meta.url));
const nyne = readFileSync('D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/schet-testov.mjs', 'utf8');
const STR = "if (nabor && d.details?.error?.failureType !== 'hookFailed') continue;";
if (!nyne.includes(STR)) throw new Error('нет строки 32');
writeFileSync(join(TUT, 'r-pravka.mjs'), nyne.replace(STR, "if (nabor && d.details?.error?.failureType === 'subtestsFailed') continue;"));
writeFileSync(join(TUT, 'r-lyuboy.mjs'), nyne.replace(STR, ''));
// Выгрузка событий: тип, имя, вид, failureType.
writeFileSync(
  join(TUT, 'r-sobytiya.mjs'),
  "export default async function* (s) { for await (const e of s) if (e.type === 'test:pass' || e.type === 'test:fail') yield `${e.type} «${e.data.name}» ${e.data.details?.type ?? ''} ${e.data.details?.error?.failureType ?? ''} skip=${JSON.stringify(e.data.skip)} todo=${JSON.stringify(e.data.todo)}\\n`; }\n"
);
const REP = {
  nyne: 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/schet-testov.mjs',
  prezhniy: pathToFileURL(join(TUT, 'prezhniy.mjs')).href,
  pravka: pathToFileURL(join(TUT, 'r-pravka.mjs')).href,
  lyuboy: pathToFileURL(join(TUT, 'r-lyuboy.mjs')).href,
};
const I = "import { describe, it, test, before, after, beforeEach } from 'node:test';\n";
const sluchai = {
  'R4-B-Z-3: вложенный набор, тело бросает': I + "describe('g', () => { it('a', () => {}); describe('v', () => { throw new Error('telo'); }); });\n",
  'R4-B-Z-3: верхний набор, тело бросает до it': I + "describe('g', () => { throw new Error('telo'); });\nit('b', () => {});\n",
  'R4-B-Z-3: тело бросает после it': I + "describe('g', () => { it('a', () => {}); throw new Error('telo'); });\n",
  'R4-B-Z-3: async тело набора отвергнуто': I + "describe('g', async () => { it('a', () => {}); await Promise.reject(new Error('x')); });\n",
  'R4-B-Z-4: набор с упавшим ребёнком (ждём 1/1)': I + "describe('g', () => { it('a', () => { throw new Error('x'); }); it('b', () => {}); });\n",
  'R4-B-Z-4: вложенные наборы, упал внук (ждём 1/1)': I + "describe('g', () => { describe('v', () => { it('a', () => { throw new Error('x'); }); }); it('b', () => {}); });\n",
  'хук before набора упал': I + "describe('g', () => { before(() => { throw new Error('h'); }); it('a', () => {}); it('b', () => {}); });\n",
  'хук beforeEach упал': I + "describe('g', () => { beforeEach(() => { throw new Error('h'); }); it('a', () => {}); });\n",
  'набор с таймаутом ребёнка': I + "describe('g', { timeout: 50 }, () => { it('a', () => new Promise(() => {})); });\n",
};
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
for (const [ime, kod] of Object.entries(sluchai)) {
  const d = mkdtempSync(join(TUT, 'p-'));
  writeFileSync(join(d, 'a.test.mjs'), kod);
  const out = {};
  let kodNode;
  for (const [k, url] of Object.entries(REP)) {
    const itog = join(d, `${k}.json`);
    const r = spawnSync(process.execPath, ['--test', `--test-reporter=${url}`, `--test-reporter-destination=${itog}`, 'a.test.mjs'], { cwd: d, env: ENV });
    kodNode = r.status;
    out[k] = readFileSync(itog, 'utf8').trim();
  }
  const ev = spawnSync(process.execPath, ['--test', `--test-reporter=${pathToFileURL(join(TUT, 'r-sobytiya.mjs')).href}`, 'a.test.mjs'], { cwd: d, env: ENV, encoding: 'utf8' }).stdout.trim();
  console.log(`— ${ime} (код node ${kodNode})\n   ${Object.entries(out).map(([k, v]) => `${k} ${v}`).join(' | ')}\n   ${ev.split('\n').join('\n   ')}`);
}
