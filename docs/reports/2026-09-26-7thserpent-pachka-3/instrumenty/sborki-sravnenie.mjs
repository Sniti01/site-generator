// Сравнение сборок (сессия 16): действуют ли замеры в браузере, снятые на прежних сборках, для финальной.
// Для каждой пары папок — какие файлы различаются; для HTML страниц героев — различается ли что-то, кроме
// атрибута sizes картинки героя (строки sizes вырезаются из обеих сторон и сравнивается остаток). Только чтение.
//
//   node sborki-sravnenie.mjs <папка-финальная> <имя=папка> [<имя=папка> …]
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const [, , fin, ...pary] = process.argv;
if (!fin || !pary.length) {
  console.error('node sborki-sravnenie.mjs <папка-финальная> <имя=папка> …');
  process.exit(2);
}
const fajly = (d) => {
  const o = [];
  const obkhod = (p) => { for (const x of readdirSync(p)) { const f = join(p, x); if (statSync(f).isDirectory()) obkhod(f); else o.push(relative(d, f).split('\\').join('/')); } };
  obkhod(d);
  return o.sort();
};
const GEROI = ['max-payne-1/index.html', 'max-payne-2/index.html', 'max-payne-3/index.html', 'remake/index.html'];
const bezSizes = (t) => t.replace(/ sizes="[^"]*"/g, ' sizes=""');
const F = fajly(fin);
console.log(`финальная: ${fin} (${F.length} файлов)`);
for (const para of pary) {
  const [imya, papka] = para.split('=');
  const P = fajly(papka);
  const vse = [...new Set([...F, ...P])].sort();
  const raznye = vse.filter((f) => !F.includes(f) || !P.includes(f) || !readFileSync(join(fin, f)).equals(readFileSync(join(papka, f))));
  console.log(`\n== ${imya}: ${papka} (${P.length} файлов); различаются ${raznye.length}: ${raznye.join(', ') || 'нет'}`);
  for (const g of GEROI) {
    if (!F.includes(g) || !P.includes(g)) { console.log(`  ${g}: нет в одной из сборок`); continue; }
    const a = readFileSync(join(fin, g), 'utf8');
    const b = readFileSync(join(papka, g), 'utf8');
    if (a === b) { console.log(`  ${g}: побайтно равны`); continue; }
    console.log(`  ${g}: различаются; без атрибутов sizes — ${bezSizes(a) === bezSizes(b) ? 'равны (различие только в sizes)' : 'РАЗЛИЧАЮТСЯ И ВНЕ sizes'}`);
  }
}
