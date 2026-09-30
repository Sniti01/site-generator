// Прогон live:check сессии 25 с регистратором ответов (П113 «Как прочитано» п. 8): node live-check.mjs <номер прогона>
// Запуск — `node --import <zapis-otvetov.mjs> tools/check-live.mjs` из папки сайта (это и есть npm run live:check с записью
// ответов; код инструмента тот же); журнал — ../zamery/live-check-<номер>.txt как есть (CR срезаны), ответы —
// ../zamery/otvety-progon-<номер>.json. Нужна сборка dist/ выложенного коммита (или коммита, чьи HTML равны выложенным).
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const zdes = dirname(fileURLToPath(import.meta.url));
const SAYT = resolve(zdes, '../../../../sites/7thserpent.com');
const nomer = process.argv[2];
if (!/^[12]$/.test(nomer ?? '')) {
  console.error('node live-check.mjs <1|2> — не больше двух прогонов (П113)');
  process.exit(2);
}
const r = spawnSync(process.execPath, ['--import', pathToFileURL(join(zdes, 'zapis-otvetov.mjs')).href, 'tools/check-live.mjs'], { cwd: SAYT, encoding: 'utf8', env: { ...process.env, ZAPIS_NOMER: nomer, NO_COLOR: '1' }, maxBuffer: 64 * 1024 * 1024 });
const tekst = `${r.stdout ?? ''}${r.stderr ?? ''}`.replace(/\r/g, '');
mkdirSync(join(zdes, '../zamery'), { recursive: true });
writeFileSync(join(zdes, '../zamery', `live-check-${nomer}.txt`), `$ node --import …/zapis-otvetov.mjs tools/check-live.mjs   (npm run live:check с записью ответов; папка: sites/7thserpent.com)\nначало: ${new Date().toISOString()}\n\n${tekst}\nкод выхода: ${r.status}\n`);
console.log(tekst.split('\n').filter((s) => /^ПЛОХО|проверок живого сайта/.test(s)).join('\n'));
console.log(`код выхода: ${r.status}`);
