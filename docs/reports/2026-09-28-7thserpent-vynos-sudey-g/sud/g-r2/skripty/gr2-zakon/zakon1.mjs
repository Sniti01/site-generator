// Законные правки на настоящих входах: что говорит судья (sverka из tools/znak.mjs, мутации — в памяти).
//   node zakon1.mjs > zakon1.txt
import { sverka, wejscie, IMPORT_GARNITURY } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs';

const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
const I = `@import '${IMPORT_GARNITURY}';`;
const zamena = (s, iz, na) => {
  if (s.split(iz).length !== 2) throw new Error(`порча не применилась: ${iz}`);
  return s.replace(iz, () => na);
};
const dopImport = (put) => (w) => { w.css = zamena(w.css, I, `${I}\n@import '${put}';`); return w; };
const SLUCHAI = [
  ['контроль: чистые входы', (w) => w],
  ['Бодони latin-ext 600 рядом с latin 600 (имена с Ł, ő)', dopImport('@fontsource/bodoni-moda/latin-ext-600.css')],
  ['Бодони latin 600 italic рядом с latin 600 (курсив заголовка)', dopImport('@fontsource/bodoni-moda/latin-600-italic.css')],
  ['Бодони latin 400 рядом с latin 600 (цитаты)', dopImport('@fontsource/bodoni-moda/latin-400.css')],
  ['Бодони latin 700 рядом с latin 600', dopImport('@fontsource/bodoni-moda/latin-700.css')],
  ['Public Sans latin-ext 400 (чужая гарнитура, контроль)', dopImport('@fontsource/public-sans/latin-ext-400.css')],
  ['селектор со строкой «-->» на верхнем уровне', (w) => { w.css += '\n.q[data-strelka="-->"] { color: red; }'; return w; }],
  ['селектор со строкой «<!--» на верхнем уровне', (w) => { w.css += '\n.q[title^="<!--"] { color: red; }'; return w; }],
];
for (const [imya, mut] of SLUCHAI) {
  const { bledy } = await sverka(mut(czyste()));
  console.log(`== ${imya}: ${bledy.length ? `ОТКАЗ (${bledy.length})` : 'сверено'}`);
  for (const b of bledy) console.log(`   - ${b}`);
}
