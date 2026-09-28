// Где Node 26 ставит запись уровня файла (test:pass/test:fail с именем — путём файла) и что репортёр видит в argv.
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const d = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/r4/ispolnitel-B/zapis-fajla';
const ZHURNAL = join(d, 'zhurnal.mjs');
const { NODE_TEST_CONTEXT, ...ENV } = process.env;
rmSync(d, { recursive: true, force: true });
mkdirSync(d, { recursive: true });
writeFileSync(
  ZHURNAL,
  "export default async function* (source) {\n  yield `argv ${JSON.stringify(process.argv.slice(2))} execArgv ${JSON.stringify(process.execArgv)}\\n`;\n" +
    "  for await (const e of source) if (e.type === 'test:pass' || e.type === 'test:fail') yield `${e.type} ${JSON.stringify(e.data?.name)} file=${JSON.stringify(e.data?.file)} nesting=${e.data?.nesting} ${e.data?.details?.type ?? ''}\\n`;\n}\n"
);
const T = "import { test, describe } from 'node:test';\n";
writeFileSync(join(d, 'a.test.mjs'), T + "test('a1', () => {});\n");
writeFileSync(join(d, 'b.test.mjs'), T + "test('b1', () => {});\ntest('b2', () => { process.exit(0); });\ntest('b3', () => { throw new Error('x'); });\n");
writeFileSync(join(d, 'c.test.mjs'), T + '// пустой файл тестов\n');
writeFileSync(join(d, 'e.test.mjs'), T + "test('e1', () => { throw new Error('x'); });\nprocess.exit(0);\n");
writeFileSync(join(d, 'f.test.mjs'), T + "describe.skip('s', () => { test('f1', () => {}); });\ntest.skip('f2', () => {});\n");
for (const dop of [[], ['--test-name-pattern=a1'], ['--test-name-pattern', 'a1']]) {
  const r = spawnSync(process.execPath, ['--test', ...dop, `--test-reporter=${'file:///' + ZHURNAL}`, '--test-reporter-destination=stdout', 'a.test.mjs', 'b.test.mjs', 'c.test.mjs', 'e.test.mjs', 'f.test.mjs'], { cwd: d, env: ENV, encoding: 'utf8' });
  console.log(`=== ${JSON.stringify(dop)} код ${r.status}\n${r.stdout}${r.stderr.slice(0, 500)}`);
}
