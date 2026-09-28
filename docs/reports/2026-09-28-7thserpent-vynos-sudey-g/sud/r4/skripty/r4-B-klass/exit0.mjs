// Раунд 4, блок Б: два файла тестов в одном прогоне, как у proverki; второй выходит process.exit(0) посреди тестов.
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { kodProverki } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/schet-testov.mjs';

const d = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-B-klass/exit0';
const REPORTER = 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/schet-testov.mjs';
const ZHURNAL = 'file:///C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/r4-B-klass/sobytiya.mjs';
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
rmSync(d, { recursive: true, force: true });
mkdirSync(d, { recursive: true });
const T = "import { test } from 'node:test';\n";
writeFileSync(join(d, 'a.test.mjs'), T + "test('a1', () => {});\ntest('a2', () => {});\n");
writeFileSync(join(d, 'b.test.mjs'), T + "test('b1', () => {});\ntest('b2', () => { process.exit(0); });\ntest('b3', () => { throw new Error('sud upal by'); });\n");
const itog = join(d, 'itog.json');
const r = spawnSync(process.execPath, ['--test', `--test-reporter=${ZHURNAL}`, '--test-reporter-destination=stdout', `--test-reporter=${REPORTER}`, `--test-reporter-destination=${itog}`, 'a.test.mjs', 'b.test.mjs'], { cwd: d, env: ENV, encoding: 'utf8' });
const s = JSON.parse(readFileSync(itog, 'utf8'));
console.log(r.stdout.trimEnd());
console.log(`node --test: ${r.status}; счёт: ${JSON.stringify(s)}; kodProverki: ${kodProverki(r.status ?? 2, s)}`);
