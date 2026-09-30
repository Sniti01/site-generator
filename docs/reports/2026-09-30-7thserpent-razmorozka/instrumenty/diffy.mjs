// Диффы для взгляда владельца (сессия 25, П113 «Стоп — мой взгляд»): node diffy.mjs
// git diff f22bb92..HEAD по путям — в ../zamery/diff-*.txt как есть (git пишет LF): robots.txt; workflow второго сайта;
// сторожа выкладки (код и пробы); check-live (код, пробы, новый образец). Только чтение репозитория.
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const zdes = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(zdes, '../../../..');
const ZAMERY = join(zdes, '../zamery');
const S = 'sites/7thserpent.com';
const NABORY = [
  ['diff-robots.txt', [`${S}/public/robots.txt`]],
  ['diff-workflow.txt', ['.github/workflows/deploy-7thserpent.yml']],
  ['diff-storozha.txt', [`${S}/tools/storozha-vykladki.mjs`, `${S}/tools/testy/storozha-vykladki.test.mjs`]],
  ['diff-check-live.txt', [`${S}/tools/check-live.mjs`, `${S}/tools/testy/check-live.test.mjs`, `${S}/tools/testy/obrazec-vladelca.json`]],
];
mkdirSync(ZAMERY, { recursive: true });
const head = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: REPO, encoding: 'utf8' }).stdout.trim();
for (const [imya, puti] of NABORY) {
  const r = spawnSync('git', ['diff', '--stat', '-p', 'f22bb92', 'HEAD', '--', ...puti], { cwd: REPO, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`${imya}: git diff — код ${r.status}`);
  writeFileSync(join(ZAMERY, imya), `$ git diff --stat -p f22bb92 ${head} -- ${puti.join(' ')}\n\n${r.stdout}`);
  console.log(`${imya}: ${r.stdout.split('\n').length} строк`);
}
