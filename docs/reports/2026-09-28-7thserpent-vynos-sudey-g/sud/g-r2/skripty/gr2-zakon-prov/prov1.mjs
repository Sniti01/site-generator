// Проверка находок GR2-Z-1…Z-6 на настоящем судье (sverka из tools/znak.mjs; входы — wejscie(), порча — в памяти,
// листы-импорты и разметка — файлами в этой папке). Если задан крюк (--import kryuk.mjs), судья — мутант.
//   node [--import ./kryuk.mjs] prov1.mjs [фильтр]
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sverka, wejscie, IMPORT_GARNITURY } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs';

const PAPKA = join(import.meta.dirname, 'vhody');
mkdirSync(PAPKA, { recursive: true });
const put = (p) => p.replace(/\\/g, '/');
const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
const I = `@import '${IMPORT_GARNITURY}';`;
const TW = "@import 'tailwindcss' source('../../src');";
const YADRO = "@import '@factory/core/styles/a11y.css';";
const zamena = (s, iz, na) => {
  if (s.split(iz).length !== 2) throw new Error(`порча не применилась: ${iz}`);
  return s.replace(iz, () => na);
};
let n = 0;
const list = (tekst, hvost = '') => (w) => {
  const f = join(PAPKA, `list-${++n}.css`);
  writeFileSync(f, tekst);
  w.css = zamena(w.css, YADRO, `${YADRO}\n@import '${put(f)}'${hvost};`);
  return w;
};
const dopImport = (p) => (w) => { w.css = zamena(w.css, I, `${I}\n@import '${p}';`); return w; };
const FF = "@font-face { font-family: 'Bodoni Moda'; font-style: normal; font-weight: 600; src: url(x.woff2); }";
const SLUCHAI = [
  ['K контроль: чистые входы', (w) => w],
  ['Z1 latin-600-italic рядом с latin-600', dopImport('@fontsource/bodoni-moda/latin-600-italic.css')],
  ['Z1 latin-400 рядом с latin-600', dopImport('@fontsource/bodoni-moda/latin-400.css')],
  ['Z1 latin-700 рядом с latin-600', dopImport('@fontsource/bodoni-moda/latin-700.css')],
  ['Z1 контроль latin-ext-600 (ждём отказ)', dopImport('@fontsource/bodoni-moda/latin-ext-600.css')],
  ["Z2 @import 'tailwindcss'; без source()", (w) => { w.css = zamena(w.css, TW, "@import 'tailwindcss';"); return w; }],
  ["Z2 source('../..')", (w) => { w.css = zamena(w.css, TW, "@import 'tailwindcss' source('../..');"); return w; }],
  ["Z5 source(none) + @source '../../src' (ждём сверено)", (w) => { w.css = zamena(w.css, TW, "@import 'tailwindcss' source(none);\n@source '../../src';"); return w; }],
  ['Z3 .q[data-strelka="-->"]', (w) => { w.css += '\n.q[data-strelka="-->"] { color: red; }'; return w; }],
  ['Z3 .q[title^="<!--"]', (w) => { w.css += '\n.q[title^="<!--"] { color: red; }'; return w; }],
  ['СВОЙ: .a-->.b (класс «a--», затем комбинатор >)', (w) => { w.css += '\n.a-->.b { color: red; }'; return w; }],
  ['СВОЙ: @supports (content: "-->")', (w) => { w.css += '\n@supports (content: "-->") { .b { color: red; } }'; return w; }],
  ['Z4/M2 грань Бодони 600 src: local(Georgia) в импорте (ждём отказ)', list("@font-face { font-family: 'Bodoni Moda'; font-style: normal; font-weight: 600; src: local('Georgia'); }\n")],
  ['Z4/M5 грань Бодони внутри @media в импорте (ждём отказ)', list(`@media screen { ${FF} }\n`)],
  ['Z4/M5 грань Бодони в импорте с layer(base) (ждём отказ)', list(`${FF}\n`, ' layer(base)')],
  ['Z6/M1 :root { --x: { a: b }; } в импорте (ждём «не читается»)', list(':root { --x: { a: b }; }\n')],
];
const filtr = process.argv[2];
for (const [imya, mut] of SLUCHAI.filter(([i]) => !filtr || i.startsWith(filtr))) {
  const t0 = Date.now();
  const { bledy } = await sverka(mut(czyste()));
  console.log(`== ${imya}: ${bledy.length ? `ОТКАЗ (${bledy.length})` : 'сверено'} [${Date.now() - t0} мс]`);
  for (const b of bledy) console.log(`   - ${b.slice(0, 300)}`);
}
