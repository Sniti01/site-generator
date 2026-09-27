// Срез окончаний по одиннадцати страницам спроса пачек 1–3 (сессия 16, П93, приёмка): запускает
// `docs/reports/2026-09-26-7thserpent-pachka-2/zamery/ngram-srez-okonchaniy.mjs` сессии 15 КАК ЕСТЬ
// (страница — аргументом, списка и хеша в нём нет) по странице за раз, `N=8`, режим `stem`, и печатает
// одну шапку с командой и сборкой. Замена цикла оболочки, которым сессия 15 писала шапку вывода
// (раунд 3, P3-R3-KOPII-6); сам срез не правится.
// Копия для сессии 17 (П95: «со срезом окончаний — только названия и цитаты в кавычках») — отличие от
// docs/reports/2026-09-26-7thserpent-pachka-3/instrumenty/srez-okonchaniy-11.mjs (b260ac9): список страниц
// (плюс /quotes/, двенадцать), имя в строке запуска и эти три строки шапки.
// Копия для сессии 18 (П98, пятнадцать страниц) — отличие от docs/reports/2026-09-27-7thserpent-pachka-4/instrumenty/
// srez-okonchaniy-12.mjs (b498fed): список страниц (плюс /gameplay/, /max-payne-3/guide/, /movie/), имя
// в строке запуска и сообщении и эти три строки шапки; «12 секций» ниже — теперь 15.
//
//   node srez-okonchaniy-15.mjs <dist> <сборка>
//
// Проверки по выводу (P3-R3-KOPII-6): 15 секций «== /…/», в каждой «N=8», в секции `/max-payne-2/` —
// «disappointing sale of» (единственное число — срез окончаний работал). Код 2 — если хоть одна не так.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const [, , dist, sborka] = process.argv;
if (!dist || !sborka) {
  console.error('node srez-okonchaniy-15.mjs <dist> <сборка>');
  process.exit(2);
}
const zdes = dirname(fileURLToPath(import.meta.url));
const srez = join(zdes, '../../2026-09-26-7thserpent-pachka-2/zamery/ngram-srez-okonchaniy.mjs');
const STRANICY = ['/pc/', '/games-like-max-payne/', '/media/', '/max-payne-3/', '/max-payne-1/', '/max-payne-2/', '/remake/', '/story/', '/voice-and-face/', '/cheats/', '/mods/', '/quotes/', '/gameplay/', '/max-payne-3/guide/', '/movie/'];
console.log(`сборка ${sborka} (${dist}); скрипт docs/reports/2026-09-26-7thserpent-pachka-2/zamery/ngram-srez-okonchaniy.mjs как есть: node ngram-srez-okonchaniy.mjs <dist>/<страница>/index.html 8 stem`);
let plokho = 0;
for (const s of STRANICY) {
  const r = spawnSync(process.execPath, [srez, join(dist, s.slice(1), 'index.html'), '8', 'stem'], { encoding: 'utf8' });
  console.log(`== ${s}`);
  process.stdout.write(r.stdout);
  if (r.status !== 0 || !/N=8\b/.test(r.stdout)) { plokho += 1; console.log(`   ОТКАЗ: код ${r.status}, ${r.stderr.trim().slice(0, 200)}`); }
  if (s === '/max-payne-2/' && !r.stdout.includes('disappointing sale of')) { plokho += 1; console.log('   ОТКАЗ: канарейки «disappointing sale of» нет — срез окончаний не работал'); }
}
console.log(`секций ${STRANICY.length}; отказов проверки вывода ${plokho}`);
process.exit(plokho ? 2 : 0);
