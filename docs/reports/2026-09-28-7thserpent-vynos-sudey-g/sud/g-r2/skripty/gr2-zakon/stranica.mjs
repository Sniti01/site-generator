// Путь судьи против настоящей страницы: CSS, который судья собирает по global.css (cssStranicy — вывезен крюком
// в памяти), и CSS сборки 3b78f28 (_astro/*.css): --font-display, свои @font-face 'Bodoni Moda', число правил.
// Плюс сторож sayt:znak-dist на папке эталонной сборки (только чтение).
//   node --import kryuk.mjs stranica.mjs   (GR2_MUT: вывоз cssStranicy)
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as z from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs';

const DIST = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const sudya = await z.cssStranicy(z.wejscie().css);
const sborka = readdirSync(join(DIST, '_astro')).filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(DIST, '_astro', f), 'utf8')).join('\n');
const opis = (css) => {
  const { uzly, bledy } = z.drzewoCss(css);
  const fd = z.deklaracje(uzly).filter((d) => d.imie === 'font-display').map((d) => d.wartosc);
  const ff = [];
  const pravila = [];
  const obojti = (l) => { for (const u of l) { if (!u.oper && /^@font-face$/i.test(u.prelude) && (u.decls ?? []).some((d) => /bodoni moda/i.test(d.wartosc))) ff.push((u.decls.find((d) => d.imie === 'src')?.wartosc ?? '').replace(/.*\//, '…/').slice(0, 60)); if (u.tip === 'rule') pravila.push(u.prelude.replace(/\s+/g, '')); obojti(u.children ?? []); } };
  obojti(uzly);
  return { bledy: bledy.length, fd, ff, pravila: new Set(pravila) };
};
const a = opis(sudya);
const b = opis(sborka);
console.log(`судья: ошибок разбора ${a.bledy}; --font-display: ${a.fd.join(' | ')}; @font-face Бодони: ${a.ff.length}; правил ${a.pravila.size}`);
console.log(`сборка: ошибок разбора ${b.bledy}; --font-display: ${b.fd.join(' | ')}; @font-face Бодони: ${b.ff.length}; правил ${b.pravila.size}`);
const tolkoSudya = [...a.pravila].filter((p) => !b.pravila.has(p));
const tolkoSborka = [...b.pravila].filter((p) => !a.pravila.has(p));
console.log(`правила только у судьи (${tolkoSudya.length}): ${tolkoSudya.slice(0, 15).join('  ')}`);
console.log(`правила только в сборке (${tolkoSborka.length}): ${tolkoSborka.slice(0, 15).join('  ')}`);

const integ = z.default();
try {
  await integ.hooks['astro:build:done']({ dir: pathToFileURL(DIST + '/'), logger: { error: (s) => console.log(`сторож: ${s}`), info: (s) => console.log(`сторож: ${s}`) } });
} catch (e) {
  console.log(`сторож: ОТКАЗ — ${e.message}`);
}
