// Прогон одного файла проб сайта (сессия 25): node proby.mjs <файл проб от папки сайта> <журнал — абсолютный путь>
// `node --test --test-reporter=spec <файл>` из папки сайта, без цвета; журнал — вывод как есть (CR срезаны), в печать —
// строки итога (ℹ tests / pass / fail / todo) и код выхода. Только node; пробы — после коммита (порядок «коммит, пробы»).
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAYT = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../sites/7thserpent.com');
const [fajl, zhurnal] = process.argv.slice(2);
if (!fajl || !zhurnal || !isAbsolute(zhurnal)) {
  console.error('node proby.mjs <файл проб от папки сайта> <абсолютный путь журнала>');
  process.exit(2);
}
const r = spawnSync(process.execPath, ['--test', '--test-reporter=spec', fajl], { cwd: SAYT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' } });
const tekst = `${r.stdout ?? ''}${r.stderr ?? ''}`.replace(/\r/g, '');
mkdirSync(dirname(zhurnal), { recursive: true });
writeFileSync(zhurnal, `$ node --test --test-reporter=spec ${fajl}\n(папка: sites/7thserpent.com)\n\n${tekst}\nкод выхода: ${r.status}\n`);
for (const s of tekst.split('\n').filter((x) => /^ℹ (tests|pass|fail|todo|cancelled) /.test(x))) console.log(s);
console.log(`код выхода: ${r.status}; журнал — ${zhurnal}`);
