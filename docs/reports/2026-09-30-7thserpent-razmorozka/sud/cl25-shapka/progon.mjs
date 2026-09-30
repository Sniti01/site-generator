// Прогон проб check-live на копии коммита 1480f7e (вне репозитория), вывод TAP — в файл.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-cl25-shapka';
const SAYT = join(PAPKA, 'k-1480f7e/sites/7thserpent.com');
const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', join(SAYT, 'tools/testy/check-live.test.mjs')], { cwd: SAYT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
writeFileSync(join(PAPKA, 'progon-tap.txt'), `${r.stdout}\n--- stderr ---\n${r.stderr}\n--- код ${r.status} ---\n`);
const stroki = r.stdout.split('\n');
const todo = stroki.filter((s) => /^(not )?ok \d+ .*# TODO/.test(s));
console.log(`код ${r.status}; строк TODO ${todo.length}`);
for (const s of todo) console.log(s.slice(0, 160));
for (const s of stroki.filter((x) => /^# (tests|pass|fail|todo|skipped|cancelled|suites)/.test(x))) console.log(s);
