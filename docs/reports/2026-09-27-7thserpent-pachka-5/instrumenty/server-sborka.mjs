// Раздаёт ли сервер браузерных прогонов ровно ту сборку, о которой говорит доклад (сессия 18, П98): HTTP GET каждой
// из 17 страниц с сервера копии dist/ и побайтовая сверка тела с index.html папки sites/7thserpent.com/dist
// (сборка последнего коммита кода и текстов). Форма — сверки server-4432-sborka.txt доработки П96. Только чтение.
//   node server-sborka.mjs <адрес сервера> <сборка>
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [, , base, sborka] = process.argv;
if (!base || !sborka) { console.error('node server-sborka.mjs <адрес сервера> <сборка>'); process.exit(2); }
const dist = join(dirname(fileURLToPath(import.meta.url)), '../../../../sites/7thserpent.com/dist');
const STRANICY = ['/', '/max-payne-1/', '/max-payne-2/', '/max-payne-3/', '/remake/', '/pc/', '/media/', '/games-like-max-payne/', '/404/', '/story/', '/voice-and-face/', '/cheats/', '/mods/', '/quotes/', '/gameplay/', '/max-payne-3/guide/', '/movie/'];
console.log(`сервер ${base} против sites/7thserpent.com/dist (сборка ${sborka}): HTTP GET ${STRANICY.length} страниц, тело = index.html`);
let plokho = 0;
for (const s of STRANICY) {
  const r = await fetch(base + s);
  const telo = Buffer.from(await r.arrayBuffer());
  const fajl = readFileSync(join(dist, s.slice(1), 'index.html'));
  const ok = r.status === 200 && telo.equals(fajl);
  if (!ok) plokho += 1;
  console.log(`${s.padEnd(24)} ответ ${r.status} ${ok ? '= dist' : '≠ dist'}`);
}
console.log(plokho ? `ПЛОХО: ${plokho}` : `совпадает: ${STRANICY.length} из ${STRANICY.length}`);
process.exit(plokho ? 1 : 0);
