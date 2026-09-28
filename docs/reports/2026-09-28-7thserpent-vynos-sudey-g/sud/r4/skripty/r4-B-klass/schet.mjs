// Раунд 4, блок Б, линза «класс или случай»: репортёр счёта (B3-4, B3-5) — члены классов на настоящем node --test.
// Прогон — как schet() в tools/testy/proverki.test.mjs: node --test с репортёром tools/schet-testov.mjs.
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { kodProverki } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/schet-testov.mjs';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-B-klass/schet';
const REPORTER = 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/schet-testov.mjs';
const { NODE_TEST_CONTEXT, ...ENV } = process.env;

function prognat(imya, kod) {
  const d = join(PAPKA, imya);
  rmSync(d, { recursive: true, force: true });
  mkdirSync(d, { recursive: true });
  writeFileSync(join(d, 'a.test.mjs'), kod);
  const itog = join(d, 'itog.json');
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', '--test-reporter-destination=stdout', `--test-reporter=${REPORTER}`, `--test-reporter-destination=${itog}`, 'a.test.mjs'], { cwd: d, env: ENV, encoding: 'utf8' });
  const s = existsSync(itog) ? JSON.parse(readFileSync(itog, 'utf8')) : null;
  const stroki = (r.stdout ?? '').split('\n').filter((x) => /^(ℹ|✖|✔|﹣|#)|tests |pass |fail |skipped|todo|cancelled/.test(x.trim())).slice(-9).map((x) => '      ' + x.trimEnd());
  console.log(`${imya}\n   node --test: ${r.status}; счёт: ${JSON.stringify(s)}; kodProverki: ${s ? kodProverki(r.status ?? 2, s) : '—'}\n${stroki.join('\n')}`);
}

const T = "import { test, describe, it } from 'node:test';\n";
prognat('nabor-telo-padaet', T + "test('a', () => {});\ndescribe('g', () => { it('b', () => {}); throw new Error('telo nabora'); });\n");
prognat('nabor-async-otkaz', T + "test('a', () => {});\ndescribe('g', async () => { await 0; throw new Error('telo nabora'); });\n");
prognat('fajl-otkaz-posle-testov', T + "test('a', () => {});\nsetTimeout(() => { throw new Error('posle testov'); }, 50);\n");
prognat('fajl-exit-0-sredi-testov', T + "test('a', () => {});\ntest('b', () => { process.exit(0); });\ntest('c', () => { throw new Error('ne dojdet'); });\n");
prognat('expectFailure', T + "test('xf', { expectFailure: true }, () => { throw new Error('ozhidaemo'); });\ntest('xp', { expectFailure: true }, () => {});\n");
