// R4-B-K-4, R4-B-K-5: настоящий node --test с репортёром счёта репозитория (как schet() в proverki.test.mjs).
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { kodProverki } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/schet-testov.mjs';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-B-klass-prov/schet';
const REPORTER = 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/schet-testov.mjs';
const { NODE_TEST_CONTEXT, ...ENV } = process.env;

function prognat(imya, fajly) {
  const d = join(PAPKA, imya);
  rmSync(d, { recursive: true, force: true });
  mkdirSync(d, { recursive: true });
  for (const [f, kod] of Object.entries(fajly)) writeFileSync(join(d, f), kod);
  const itog = join(d, 'itog.json');
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', '--test-reporter-destination=stdout', `--test-reporter=${REPORTER}`, `--test-reporter-destination=${itog}`, ...Object.keys(fajly)], { cwd: d, env: ENV, encoding: 'utf8' });
  const s = existsSync(itog) ? JSON.parse(readFileSync(itog, 'utf8')) : null;
  const tap = (r.stdout ?? '').split('\n').filter((x) => /^\s*(not ok|ok) |^# (tests|pass|fail|cancelled)/.test(x)).map((x) => '     ' + x.trimEnd());
  console.log(`${imya}\n   node --test: ${r.status}; счёт: ${JSON.stringify(s)}; kodProverki: ${s ? kodProverki(r.status ?? 2, s) : '—'}\n${tap.join('\n')}`);
}

const T = "import { test, describe, it } from 'node:test';\n";
// K-4
prognat('k4-async-describe-otkaz', { 'a.test.mjs': T + "test('a', () => {});\ndescribe('g', async () => { await 0; throw new Error('x'); });\n" });
prognat('k4-svoy-sync-throw-bez-detey', { 'a.test.mjs': T + "test('a', () => {});\ndescribe('g', () => { throw new Error('x'); });\n" });
prognat('k4-svoy-nabor-timeout', { 'a.test.mjs': T + "test('a', () => {});\ndescribe('g', { timeout: 20 }, async () => { await new Promise((r) => setTimeout(r, 300)); it('b', () => {}); });\n" });
prognat('k4-kontrol-heh-after', { 'a.test.mjs': T + "import { after } from 'node:test';\ntest('a', () => {});\ndescribe('g', () => { after(() => { throw new Error('h'); }); it('ok', () => {}); });\n" });
// K-5
const A = T + "test('a1', () => {});\ntest('a2', () => {});\n";
prognat('k5-exit0-posredi', { 'a.test.mjs': A, 'b.test.mjs': T + "test('b1', () => {});\ntest('b2', () => { process.exit(0); });\ntest('b3', () => { throw new Error('ne dojdet'); });\n" });
prognat('k5-svoy-exit0-verhniy-uroven', { 'a.test.mjs': A, 'b.test.mjs': T + "test('b1', () => { throw new Error('ne vypolnitsya'); });\nprocess.exit(0);\n" });
prognat('k5-svoy-exit0-odin-fajl', { 'b.test.mjs': T + "test('b1', () => {});\ntest('b2', () => { process.exit(0); });\ntest('b3', () => { throw new Error('ne dojdet'); });\n" });
prognat('k5-kontrol-exit1', { 'a.test.mjs': A, 'b.test.mjs': T + "test('b1', () => {});\ntest('b2', () => { process.exit(1); });\n" });
