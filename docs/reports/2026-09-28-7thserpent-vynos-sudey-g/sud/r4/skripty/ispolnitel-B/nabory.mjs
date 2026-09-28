// События test:pass/test:fail наборов и детей по формам падения: тип, причина, skip/todo — и счёт нынешнего репортёра.
import { mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const d = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/ispolnitel-B/nabory';
const ZHURNAL = join(d, 'zhurnal.mjs');
const SCHET = process.argv[2] ?? 'D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/schet-testov.mjs';
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
rmSync(d, { recursive: true, force: true });
mkdirSync(d, { recursive: true });
writeFileSync(
  ZHURNAL,
  "export default async function* (source) {\n  for await (const e of source) if (e.type === 'test:pass' || e.type === 'test:fail') yield `  ${e.type} ${JSON.stringify(e.data?.name)} ${e.data?.details?.type ?? ''} ${e.data?.details?.error?.failureType ?? ''} skip=${JSON.stringify(e.data?.skip)} todo=${JSON.stringify(e.data?.todo)}\\n`;\n}\n"
);
const T = "import { test, describe, it, before, after, beforeEach } from 'node:test';\nconst spat = (ms) => new Promise((r) => setTimeout(r, ms));\n";
const FORMY = {
  'тело набора бросает после it': "describe('g', () => { it('a', () => {}); throw new Error('x'); });",
  'async тело набора отвергнуто после it': "describe('g', async () => { it('a', () => {}); await 0; throw new Error('x'); });",
  'таймаут набора': "describe('g', { timeout: 50 }, () => { it('a', async () => { await spat(300); }); });",
  "describe skip ''": "describe('g', { skip: '' }, () => { it('a', () => {}); it('b', () => {}); });",
  'beforeEach бросает': "describe('g', () => { beforeEach(() => { throw new Error('h'); }); it('a', () => {}); });",
  'before бросает': "describe('g', () => { before(() => { throw new Error('h'); }); it('a', () => {}); it('b', () => {}); });",
  'after бросает': "describe('g', () => { after(() => { throw new Error('h'); }); it('a', () => {}); });",
  'ребёнок падает': "describe('g', () => { it('a', () => { throw new Error('x'); }); it('b', () => {}); });",
  'тело без детей бросает (K-4, P-2)': "test('a', () => {});\ndescribe('g', () => { throw new Error('x'); });",
  'вложенный набор бросает (Z-3)': "describe('g', () => { it('a', () => {}); describe('v', () => { throw new Error('telo'); }); });",
  'подтест теста падает': "test('p', async (t) => { await t.test('c', () => { throw new Error('x'); }); });",
  'подтест не дождались': "test('p', (t) => { t.test('c', async () => { await spat(300); }); });",
  'таймаут теста': "test('p', { timeout: 50 }, async () => { await spat(300); });",
  'таймаут теста с подтестом': "test('p', { timeout: 50 }, async (t) => { await t.test('c', async () => { await spat(300); }); });",
  'подтест подтеста падает в наборе': "describe('g', () => { it('a', async (t) => { await t.test('c', () => { throw new Error('x'); }); }); });",
  'describe.todo с падением': "describe.todo('g', () => { it('a', () => { throw new Error('x'); }); });",
};
for (const [imya, kod] of Object.entries(FORMY)) {
  writeFileSync(join(d, 'a.test.mjs'), T + kod + '\n');
  const itog = join(d, 'itog.json');
  const r = spawnSync(process.execPath, ['--test', `--test-reporter=file:///${ZHURNAL}`, '--test-reporter-destination=stdout', `--test-reporter=file:///${SCHET}`, `--test-reporter-destination=${itog}`, 'a.test.mjs'], { cwd: d, env: ENV, encoding: 'utf8' });
  console.log(`=== ${imya}: node ${r.status}, счёт ${readFileSync(itog, 'utf8').trim()}\n${r.stdout.trimEnd()}`);
}
