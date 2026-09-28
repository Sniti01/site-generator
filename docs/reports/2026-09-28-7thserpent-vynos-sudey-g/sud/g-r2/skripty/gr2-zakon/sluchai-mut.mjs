// Входы для последствий мутантов: настоящие входы, лист и разметка — временными файлами (вне репозитория).
//   node --import kryuk.mjs sluchai-mut.mjs   (мутация — GR2_MUT)
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { sverka, wejscie } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs';

const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
const ISH = "@import 'tailwindcss' source('../../src');";
const POSLE_YADRA = "@import '@factory/core/styles/a11y.css';";
const put = (p) => p.replace(/\\/g, '/');
const zamena = (s, iz, na) => {
  if (s.split(iz).length !== 2) throw new Error(`порча не применилась: ${iz}`);
  return s.replace(iz, () => na);
};
const sListom = (tekst, hvost = '') => (w) => {
  const d = mkdtempSync(join(tmpdir(), 'gr2-zakon-'));
  writeFileSync(join(d, 'list.css'), tekst);
  w.css = zamena(w.css, POSLE_YADRA, `${POSLE_YADRA}\n@import '${put(join(d, 'list.css'))}'${hvost};`);
  return w;
};
const BODONI_LOCAL = "@font-face { font-family: 'Bodoni Moda'; font-style: normal; font-weight: 600; src: local('Georgia'); }\n";
const BODONI_URL = "@font-face { font-family: 'Bodoni Moda'; font-style: normal; font-weight: 600; src: url(x.woff2); }\n";
const SLUCHAI = [
  ['M2: своя @font-face Бодони 600 с src: local() в импортированном листе', sListom(BODONI_LOCAL)],
  ['M3/M4: @import tailwindcss без source() — автоматическое обнаружение', (w) => { w.css = zamena(w.css, ISH, "@import 'tailwindcss';"); return w; }],
  ["M4: @import tailwindcss source(none) и @source '../../src'", (w) => { w.css = zamena(w.css, ISH, "@import 'tailwindcss' source(none);\n@source '../../src';"); return w; }],
  ['M5: своя @font-face Бодони внутри @media в импортированном листе', sListom(`@media all { ${BODONI_URL} }\n`)],
  ['M5: своя @font-face Бодони в листе, импортированном в слой (layer(base))', sListom(BODONI_URL, ' layer(base)')],
  ['M1: значение-блок у custom property в импортированном листе', sListom(':root { --x: { a: b }; }\n')],
];
for (const [imya, mut] of SLUCHAI) {
  const { bledy } = await sverka(mut(czyste()));
  console.log(`   ${imya}: ${bledy.length ? `ОТКАЗ — ${bledy.map((b) => b.slice(0, 150)).join(' | ')}` : 'сверено'}`);
}
