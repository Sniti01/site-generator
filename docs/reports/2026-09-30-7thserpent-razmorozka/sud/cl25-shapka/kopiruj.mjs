// Копия файлов коммита 1480f7e в папку скептика (только чтение репозитория: git show).
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const REPO = 'D:/SEO/cloud/site-generator';
const KOMMIT = process.argv[2] || '1480f7e';
const KUDA = join('C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-cl25-shapka', 'k-' + KOMMIT);

const spisok = process.argv.slice(3).length ? process.argv.slice(3) : [
  'sites/7thserpent.com/tools/check-live.mjs',
  'sites/7thserpent.com/tools/testy/check-live.test.mjs',
  'sites/7thserpent.com/tools/testy/obrazec-khostera.json',
  'sites/7thserpent.com/tools/testy/obrazec-vladelca.json',
  'sites/7thserpent.com/tools/testy/obshchee.mjs',
  'sites/7thserpent.com/public/robots.txt',
  'sites/7thserpent.com/structure.json',
  'sites/7thserpent.com/package.json',
];

for (const put of spisok) {
  const bajty = execFileSync('git', ['-C', REPO, 'show', `${KOMMIT}:${put}`], { maxBuffer: 64 * 1024 * 1024 });
  const cel = join(KUDA, put);
  mkdirSync(dirname(cel), { recursive: true });
  writeFileSync(cel, bajty);
  console.log(`${put}: ${bajty.length} байт`);
}
