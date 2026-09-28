// Раунд 4, блок Б: набор describe в счёте — нынешний репортёр, мутант «любой упавший набор — упал» и предлагаемая правка
// «набор — упал, кроме subtestsFailed» на случаях: тело вложенного набора бросает; упавший ребёнок; упавший хук;
// тело набора бросает после регистрации ребёнка; и все утверждения proverki.test.mjs о schet().
// node pravka-nabora.mjs
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ZDES = dirname(fileURLToPath(import.meta.url));
const ish = readFileSync('D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/schet-testov.mjs', 'utf8');
const STROKA = "if (nabor && d.details?.error?.failureType !== 'hookFailed') continue;";
if (!ish.includes(STROKA)) throw new Error('нет строки набора');
mkdirSync(join(ZDES, 'mut'), { recursive: true });
const varianty = {
  nyne: ish,
  'mutant-lyuboy-nabor-upal': ish.replace(STROKA, ''),
  'pravka-krome-subtestsFailed': ish.replace(STROKA, "if (nabor && d.details?.error?.failureType === 'subtestsFailed') continue;"),
};
const url = {};
for (const [k, v] of Object.entries(varianty)) {
  writeFileSync(join(ZDES, 'mut', `nabor-${k}.mjs`), v);
  url[k] = pathToFileURL(join(ZDES, 'mut', `nabor-${k}.mjs`)).href;
}
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
function schet(rep, kod) {
  const d = mkdtempSync(join(ZDES, 'pn-'));
  writeFileSync(join(d, 'a.test.mjs'), kod);
  const itog = join(d, 'itog.json');
  const r = spawnSync(process.execPath, ['--test', `--test-reporter=${rep}`, `--test-reporter-destination=${itog}`, 'a.test.mjs'], { cwd: d, env: ENV });
  return `${readFileSync(itog, 'utf8').trim()} (код node ${r.status})`;
}
const D = "import { describe, it, after, before } from 'node:test';\n";
const sluchai = {
  'тело вложенного набора бросает': D + "describe('g', () => { it('a', () => {}); describe('v', () => { throw new Error('telo'); }); });\n",
  'тело набора бросает до детей': D + "describe('g', () => { throw new Error('telo'); });\ndescribe('h', () => { it('ok', () => {}); });\n",
  'упавший ребёнок (ждём упало 1)': D + "describe('g', () => { it('a', () => { throw new Error('x'); }); it('b', () => {}); });\n",
  'упавший after набора': D + "describe('g', () => { after(() => { throw new Error('a'); }); it('ok', () => {}); });\n",
  'упавший before набора': D + "describe('g', () => { before(() => { throw new Error('h'); }); it('a', () => {}); });\n",
  'B3-4 стр. 39 (ждём 0/0 и 2/0)': D + "describe('pusto', () => {});\ndescribe('g', () => { it.skip('s', () => {}); it.todo('t'); });\ndescribe('g2', () => { it('a', () => {}); it('b', () => {}); });\n",
};
for (const [imya, kod] of Object.entries(sluchai)) {
  console.log(`${imya}\n${Object.keys(url).map((k) => `  ${k}: ${schet(url[k], kod)}`).join('\n')}`);
}
