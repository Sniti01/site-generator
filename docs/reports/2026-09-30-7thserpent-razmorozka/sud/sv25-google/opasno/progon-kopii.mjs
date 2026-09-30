// Опорный прогон проб сторожей на копии (до своих порч): ждём 149 проб, прошло 149.
// Вывод node --test целиком — в progon-kopii.txt, на экран — только итоговые строки.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ZDES = dirname(fileURLToPath(import.meta.url));
const PROBY = join(ZDES, 'kopiya/sites/7thserpent.com/tools/testy/storozha-vykladki.test.mjs');
const r = spawnSync(process.execPath, ['--test', PROBY], { encoding: 'utf8', cwd: join(ZDES, 'kopiya/sites/7thserpent.com') });
const vse = `${r.stdout}\n--- stderr ---\n${r.stderr}\n--- код ${r.status} ---\n`;
writeFileSync(join(ZDES, 'progon-kopii.txt'), vse);
const itog = vse.split('\n').filter((s) => /^ℹ (tests|pass|fail|todo|skipped|cancelled)/.test(s) || /^# (tests|pass|fail|todo)/.test(s));
process.stdout.write(`${itog.join('\n')}\nкод ${r.status}\n`);
