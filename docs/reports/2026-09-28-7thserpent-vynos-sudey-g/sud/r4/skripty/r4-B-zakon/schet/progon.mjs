// Раунд 4, блок Б, линза «законные формы»: репортёр счёта (tools/schet-testov.mjs) — нынешний, прежний (ec74257^)
// и мутации нынешнего на случаях теста proverki.test (как его schet()) и на новых случаях.
// node progon.mjs            — счёт по всем случаям и репортёрам
// node progon.mjs sobytiya   — ещё и сырые события по новым случаям
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const ZDES = dirname(fileURLToPath(import.meta.url));
const NYNE = 'D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/schet-testov.mjs';
const ishodnik = readFileSync(NYNE, 'utf8');
const { NODE_TEST_CONTEXT, ...ENV } = process.env;

function zamena(s, iz, na) {
  if (!s.includes(iz)) throw new Error(`мутация: нет куска ${iz}`);
  return s.replace(iz, na);
}
const mutacii = {
  'M-B3-4-nabor-v-proshlo': zamena(ishodnik, 'if (fajl || nabor || est(d.skip)) continue;', 'if (fajl || est(d.skip)) continue;'),
  'M-B3-4-nabor-vsegda-upal': zamena(ishodnik, "if (nabor && d.details?.error?.failureType !== 'hookFailed') continue;", ''),
  'M-B3-5-skip-istinnost': zamena(ishodnik, 'if (fajl || nabor || est(d.skip)) continue;', 'if (fajl || nabor || d.skip) continue;'),
  'M-B3-5-todo-istinnost': zamena(ishodnik, 'if (est(d.todo)) continue;', 'if (d.todo) continue;'),
  'M-B3-5-skip-telo-ne-upal': zamena(ishodnik, "if (nabor && d.details?.error?.failureType !== 'hookFailed') continue;", "if (nabor && d.details?.error?.failureType !== 'hookFailed') continue;\n      if (est(d.skip)) continue;"),
  'M-B3-5-fajl-ne-upal': zamena(ishodnik, "if (nabor && d.details?.error?.failureType !== 'hookFailed') continue;", "if (nabor && d.details?.error?.failureType !== 'hookFailed') continue;\n      if (fajl) continue;"),
};
mkdirSync(join(ZDES, 'mut'), { recursive: true });
const reportery = { nyne: pathToFileURL(NYNE).href, prezhniy: pathToFileURL(join(ZDES, 'prezhniy.mjs')).href };
for (const [k, v] of Object.entries(mutacii)) {
  writeFileSync(join(ZDES, 'mut', `${k}.mjs`), v);
  reportery[k] = pathToFileURL(join(ZDES, 'mut', `${k}.mjs`)).href;
}

function schet(reporter, kod, shablon) {
  const d = mkdtempSync(join(ZDES, 'progon-'));
  writeFileSync(join(d, 'a.test.mjs'), kod);
  const itog = join(d, 'itog.json');
  const r = spawnSync(process.execPath, ['--test', `--test-reporter=${reporter}`, `--test-reporter-destination=${itog}`, ...(shablon ? [`--test-name-pattern=${shablon}`] : []), 'a.test.mjs'], { cwd: d, env: ENV });
  return { ...JSON.parse(readFileSync(itog, 'utf8')), kodNode: r.status };
}
function sobytiya(kod) {
  const d = mkdtempSync(join(ZDES, 'progon-'));
  writeFileSync(join(d, 'a.test.mjs'), kod);
  const r = spawnSync(process.execPath, ['--test', `--test-reporter=${pathToFileURL(join(ZDES, 'sobytiya.mjs')).href}`, 'a.test.mjs'], { cwd: d, env: ENV, encoding: 'utf8' });
  return r.stdout;
}

// Утверждения proverki.test.mjs о schet() — дословно по смыслу (номер строки теста).
const IMP = "import { test } from 'node:test';\n";
const testy = {
  'B2-1 (стр. 28)': (s) => {
    const kod = IMP + "console.log('pass 5');\ntest('t', () => {});\ntest.todo('d');\n";
    assert.equal(s(kod, '^никогда$').proshlo, 0);
    const x = s(kod, null);
    assert.deepEqual({ proshlo: x.proshlo, upalo: x.upalo }, { proshlo: 1, upalo: 0 });
  },
  'B2-1 (стр. 34)': (s) => {
    const x = s(IMP + "import assert from 'node:assert';\ntest('a', async (t) => { await t.test('a1', () => {}); });\ntest('b', () => assert.fail('x'));\n", null);
    assert.deepEqual({ proshlo: x.proshlo, upalo: x.upalo }, { proshlo: 2, upalo: 1 });
  },
  'B3-4 (стр. 39)': (s) => {
    const a = s("import { describe, it } from 'node:test';\ndescribe('pusto', () => {});\ndescribe('g', () => { it.skip('s', () => {}); it.todo('t'); });\n", null);
    assert.deepEqual({ proshlo: a.proshlo, upalo: a.upalo }, { proshlo: 0, upalo: 0 });
    const b = s("import { describe, it } from 'node:test';\ndescribe('g', () => { it('a', () => {}); it('b', () => {}); });\n", null);
    assert.deepEqual({ proshlo: b.proshlo, upalo: b.upalo }, { proshlo: 2, upalo: 0 });
  },
  'B3-4 контроль (стр. 44)': (s) => {
    assert.ok(s("import { describe, it, after } from 'node:test';\ndescribe('g', () => { after(() => { throw new Error('a'); }); it('ok', () => {}); });\n", null).upalo > 0);
  },
  'B3-5 файл (стр. 48)': (s) => {
    assert.ok(s("import './net-takogo-fajla.mjs';\n", null).upalo > 0);
  },
  'B3-5 skip/todo (стр. 52)': (s) => {
    const x = s(IMP + "test('x', { skip: '' }, () => { throw new Error('telo'); });\ntest('y', (t) => { t.skip(''); });\ntest('z', { todo: '' }, () => { throw new Error('t'); });\n", null);
    assert.deepEqual({ proshlo: x.proshlo, upalo: x.upalo }, { proshlo: 0, upalo: 1 });
  },
};

const novye = {
  'N1 describe: тело набора бросает': "import { describe, it } from 'node:test';\ndescribe('g', () => { it('a', () => {}); throw new Error('telo nabora'); });\n",
  'N2 describe: упавший ребёнок': "import { describe, it } from 'node:test';\ndescribe('g', () => { it('a', () => { throw new Error('x'); }); it('b', () => {}); });\n",
  'N3 describe: упавший before': "import { describe, it, before } from 'node:test';\ndescribe('g', () => { before(() => { throw new Error('h'); }); it('a', () => {}); });\n",
  'N4 before уровня файла упал': "import { test, before } from 'node:test';\nbefore(() => { throw new Error('h'); });\ntest('a', () => {});\n",
  'N5 skip: null, тело проходит': IMP + "test('a', { skip: null }, () => {});\ntest('b', () => {});\n",
  'N6 skip: null, тело падает': IMP + "test('a', { skip: null }, () => { throw new Error('x'); });\ntest('b', () => {});\n",
  'N7 todo "", тело проходит': IMP + "test('a', { todo: '' }, () => {});\n",
  'N8 describe.todo: ребёнок падает': "import { describe, it } from 'node:test';\ndescribe.todo('g', () => { it('a', () => { throw new Error('x'); }); });\n",
  'N9 describe вложенный: тело внутреннего бросает': "import { describe, it } from 'node:test';\ndescribe('g', () => { it('a', () => {}); describe('v', () => { throw new Error('telo'); }); });\n",
  'N10 describe async: тело отвергает': "import { describe, it } from 'node:test';\ndescribe('g', async () => { it('a', () => {}); await Promise.reject(new Error('telo')); });\n",
};

const imena = Object.keys(reportery);
console.log('== утверждения proverki.test.mjs: какие краснеют под мутацией ==');
for (const r of imena) {
  const krasnye = [];
  for (const [imya, f] of Object.entries(testy)) {
    try {
      f((kod, sh) => schet(reportery[r], kod, sh));
    } catch {
      krasnye.push(imya);
    }
  }
  console.log(`${r}: красные ${krasnye.length ? krasnye.join('; ') : '— НИ ОДНОГО'}`);
}
console.log('\n== новые случаи: {proshlo, upalo} и код node ==');
for (const [imya, kod] of Object.entries(novye)) {
  const po = imena.filter((r) => ['nyne', 'prezhniy'].includes(r)).map((r) => {
    const x = schet(reportery[r], kod, null);
    return `${r}: прошло ${x.proshlo}, упало ${x.upalo}, код node ${x.kodNode}`;
  });
  console.log(`${imya}\n  ${po.join('\n  ')}`);
  if (process.argv[2] === 'sobytiya') console.log(sobytiya(kod).split('\n').filter(Boolean).map((s) => '    ' + s).join('\n'));
}
