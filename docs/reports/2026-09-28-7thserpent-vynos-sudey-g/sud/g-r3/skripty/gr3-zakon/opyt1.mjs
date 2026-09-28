// Законные формы против правки блока Г: вердикт sverka на настоящих входах с мутацией в памяти. Ничего не пишет в репозиторий.
//   node opyt1.mjs > opyt1.txt
import { writeFileSync, mkdirSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const Z = await import(pathToFileURL(join(SAYT, 'tools/znak.mjs')).href);
const { sverka, wejscie, IMPORT_GARNITURY } = Z;
const P = import.meta.dirname;
const LISTY = join(P, 'listy');
mkdirSync(LISTY, { recursive: true });
const put = (p) => p.replace(/\\/g, '/');

const baza = wejscie();
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: null });
const I = `@import '${IMPORT_GARNITURY}';`;
const POSLE_YADRA = "@import '@factory/core/styles/a11y.css';";
function zam(s, iz, na) {
  const n = s.split(iz).length - 1;
  if (n !== 1) throw new Error(`порча: «${iz.slice(0, 50)}» — ${n} раз`);
  return s.replace(iz, () => na);
}
let nomer = 0;
const list = (tekst) => { const f = join(LISTY, `l${++nomer}.css`); writeFileSync(f, tekst); return put(f); };
const sListom = (w, tekst) => { w.css = zam(w.css, POSLE_YADRA, `${POSLE_YADRA}\n@import '${list(tekst)}';`); return w; };
const fd = (v) => (w) => { w.css = w.css.replace(/--font-display:[^;]*;/, `--font-display: ${v};`); return w; };

const SLUCHAI = [
  ['контроль: чистые входы', (w) => w],
  // var() в списке --font-display — идиома темы Tailwind (ссылка на другой токен темы).
  ["V1 --font-display: 'Bodoni Moda', var(--font-serif)", fd("'Bodoni Moda', var(--font-serif)")],
  ["V2 --font-display: 'Bodoni Moda', var(--font-serif, Georgia, serif)", fd("'Bodoni Moda', var(--font-serif, Georgia, serif)")],
  ["V3 в импортированном листе :root { --font-display: 'Bodoni Moda', var(--font-serif) }", (w) => sListom(w, ":root { --font-display: 'Bodoni Moda', var(--font-serif); }\n")],
  // Импорт по корню Vite (`/src/...`): сборка разрешает его разрешателем Vite, судья — своим.
  ["R1 @import '/src/styles/global.css' (корень Vite; файл есть)", (w) => { w.css = zam(w.css, POSLE_YADRA, `${POSLE_YADRA}\n@import '/src/styles/global.css';`); return w; }],
  // Законные правки гарнитуры темы пакетом темы.
  ['T1 тема дважды (ещё раз в конце импортов)', (w) => { w.css = zam(w.css, POSLE_YADRA, `${POSLE_YADRA}\n${I}`); return w; }],
  ['T2 после темы index.css (400, все подмножества)', (w) => { w.css = zam(w.css, I, `${I}\n@import '@fontsource/bodoni-moda/index.css';`); return w; }],
  ['T3 после темы 600-italic.css', (w) => { w.css = zam(w.css, I, `${I}\n@import '@fontsource/bodoni-moda/600-italic.css';`); return w; }],
  ['T4 после темы latin-ext-400.css', (w) => { w.css = zam(w.css, I, `${I}\n@import '@fontsource/bodoni-moda/latin-ext-400.css';`); return w; }],
  ['T5 перед темой math-600.css и symbols-600.css', (w) => { w.css = zam(w.css, I, `@import '@fontsource/bodoni-moda/math-600.css';\n@import '@fontsource/bodoni-moda/symbols-600.css';\n${I}`); return w; }],
];
const out = [];
for (const [imya, mut] of SLUCHAI) {
  let bledy;
  try { ({ bledy } = await sverka(mut(czyste()))); } catch (e) { bledy = [`ИСКЛЮЧЕНИЕ ${e.message}`]; }
  out.push(`${imya}\n   ${bledy.length ? `ОТКАЗ (${bledy.length}):\n     - ${bledy.join('\n     - ')}` : 'СВЕРЕНО'}`);
}
console.log(out.join('\n'));
