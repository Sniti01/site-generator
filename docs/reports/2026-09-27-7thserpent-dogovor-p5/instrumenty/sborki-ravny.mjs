// Действуют ли браузерные замеры сессии 19 на сборке приёмки (прогонщик, не судья): побайтовая сверка двух папок сборки —
// sites/7thserpent.com/dist (пересобран прогонщиком приёмки на HEAD, содержание — коммит d160a2d) и копии dist/, которую
// раздавал сервер 4435 для главной против эталона, кадров ряда глав и внешних запросов в браузере. Только чтение.
//   node sborki-ravny.mjs <папка А> <папка Б>
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const [, , a, b] = process.argv;
if (!a || !b) { console.error('node sborki-ravny.mjs <папка А> <папка Б>'); process.exit(2); }
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const fa = new Map(walk(a).map((f) => [relative(a, f).replace(/\\/g, '/'), f]));
const fb = new Map(walk(b).map((f) => [relative(b, f).replace(/\\/g, '/'), f]));
let raznye = 0;
for (const [k, f] of fa) {
  if (!fb.has(k)) { raznye += 1; console.log(`только в А: ${k}`); continue; }
  if (!readFileSync(f).equals(readFileSync(fb.get(k)))) { raznye += 1; console.log(`различается: ${k}`); }
}
for (const k of fb.keys()) if (!fa.has(k)) { raznye += 1; console.log(`только в Б: ${k}`); }
console.log(`файлов: А ${fa.size}, Б ${fb.size}; различий ${raznye}`);
process.exit(raznye ? 1 : 0);
