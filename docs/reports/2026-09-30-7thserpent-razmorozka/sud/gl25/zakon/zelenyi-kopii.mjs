// Опорный прогон проб сторожей на копии (до своих порч): ждём 161 из 161.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-gl25/zakon';
const TEST = `${PAPKA}/kopiya/sites/7thserpent.com/tools/testy/storozha-vykladki.test.mjs`;
const r = spawnSync(process.execPath, ['--test', TEST], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const vyvod = `${r.stdout}\n--- stderr ---\n${r.stderr}\n--- код ${r.status} ---\n`;
writeFileSync(`${PAPKA}/zelenyi-kopii.txt`, vyvod);
const itogi = vyvod.split('\n').filter((s) => /^# (tests|pass|fail|cancelled|skipped|todo)\b/.test(s));
console.log(itogi.join('\n'), `\nкод ${r.status}`);
