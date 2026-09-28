// Раунд 2, линза «класс»: пути к исходу «гарнитура на странице не Бодони, а судья знака молчит» мимо правки раунда 1.
// Мутации — в памяти (w.css) и во временных листах/разметке в своей папке; репозиторий не меняется.
//   node opyt1.mjs > opyt1.txt
import { writeFileSync, mkdirSync, mkdtempSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const ZNAK = 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs';
const { sverka, wejscie, drzewoCss, deklaracje } = await import(ZNAK);
const PAPKA = import.meta.dirname;
const LISTY = join(PAPKA, 'listy');
mkdirSync(LISTY, { recursive: true });

// Копия пути сборки судьи (cssStranicy не экспортирована) — только чтобы показать вывод.
const require = createRequire(join(SAYT, 'package.json'));
const viteReq = createRequire(require.resolve('@tailwindcss/vite'));
const twNode = await import(pathToFileURL(viteReq.resolve('@tailwindcss/node')).href);
const { Scanner } = await import(pathToFileURL(viteReq.resolve('@tailwindcss/oxide')).href);
async function vyvod(css) {
  const cssPut = join(SAYT, 'src/styles/global.css');
  const c = await twNode.compile(css, { base: dirname(cssPut), from: cssPut, shouldRewriteUrls: true, onDependency: () => {} });
  const ist = (c.root === 'none' ? [] : c.root === null ? [{ base: SAYT, pattern: '**/*', negated: false }] : [{ ...c.root, negated: false }]).concat(c.sources);
  const k = c.features & twNode.Features.Utilities ? new Scanner({ sources: ist }).scan() : [];
  return twNode.optimize(c.build(k), { minify: false }).code;
}

const put = (p) => p.replace(/\\/g, '/');
const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
const POSLE_YADRA = "@import '@factory/core/styles/a11y.css';";
let n = 0;
const list = (tekst) => {
  const f = join(LISTY, `l${++n}.css`);
  writeFileSync(f, tekst);
  return put(f);
};
const sImportom = (w, stroka) => { w.css = w.css.replace(POSLE_YADRA, `${POSLE_YADRA}\n${stroka}`); return w; };
const sListom = (w, tekst) => sImportom(w, `@import '${list(tekst)}';`);
const sRazmetkoy = (w, html) => {
  const d = mkdtempSync(join(LISTY, 'r-'));
  writeFileSync(join(d, 'x.html'), html);
  w.css = w.css.replace("@import 'tailwindcss' source('../../src');", `@import 'tailwindcss' source('../../src');\n@source '${put(d)}';`);
  return w;
};
const TEMA = put(join(dirname(require.resolve('@fontsource/bodoni-moda/latin-600.css')), 'files', 'bodoni-moda-latin-600-normal.woff2'));
const ZLO = ":root { --font-display: Georgia, serif; }\n";

const SLUCHAI = [
  ['контроль: чистые входы', (w) => w],
  ['контроль: :root { --font-display: Georgia } обычным @import', (w) => sListom(w, ZLO)],
  // А. @import, который Tailwind может оставить как есть (url(), условия), — тогда его докладывает Vite.
  ['А1 @import url() в global.css', (w) => sImportom(w, `@import url('${list(ZLO)}');`)],
  ['А2 @import url() без кавычек в global.css', (w) => sImportom(w, `@import url(${list(ZLO)});`)],
  ['А3 @import с media screen в global.css', (w) => sImportom(w, `@import '${list(ZLO)}' screen;`)],
  ['А4 @import с supports() в global.css', (w) => sImportom(w, `@import '${list(ZLO)}' supports(display: grid);`)],
  ['А5 @import с layer(x) в global.css', (w) => sImportom(w, `@import '${list(ZLO)}' layer(x);`)],
  ['А6 @import url() внутри импортированного листа', (w) => sListom(w, `@import url('${list(ZLO)}');\n`)],
  // Б. Своя @font-face 'Bodoni Moda' на странице, чьи url() — «файл темы» по имени.
  ['Б1 своя @font-face: local(Georgia) перед файлом темы (импортированный лист)', (w) => sListom(w, `@font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: local('Georgia'), url('${TEMA}') format('woff2'); }\n`)],
  ['Б2 своя @font-face: файл с тем же именем на другом хосте', (w) => sListom(w, "@font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: url(https://cdn.example.net/@fontsource/bodoni-moda/files/bodoni-moda-latin-600-normal.woff2) format('woff2'); }\n")],
  ['Б3 контроль: своя @font-face только local(Georgia)', (w) => sListom(w, "@font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: local('Georgia'); }\n")],
  // В. Разметка: inline style (не кандидат Tailwind).
  ['В1 style="--font-display: Georgia" в разметке', (w) => sRazmetkoy(w, '<html style="--font-display: Georgia, serif"><h2 class="t-headline">x</h2></html>')],
  // Г. @property --font-display в импортированном листе: верх, @layer, @supports, @media.
  ['Г1 @property --font-display (верх импорта), inherits:false', (w) => sListom(w, "@property --font-display { syntax: '*'; inherits: false; }\n")],
  ['Г2 @property --font-display в @layer base', (w) => sListom(w, "@layer base { @property --font-display { syntax: '*'; inherits: false; } }\n")],
  ['Г3 @property --font-display в @supports', (w) => sListom(w, "@supports (display: grid) { @property --font-display { syntax: '*'; inherits: false; } }\n")],
  ['Г4 @property --font-display в @media all', (w) => sListom(w, "@media all { @property --font-display { syntax: '*'; inherits: false; } }\n")],
  ['Г5 @property --font-display <length> initial 0px', (w) => sListom(w, "@property --font-display { syntax: '<length>'; inherits: true; initial-value: 0px; }\n")],
];

for (const [imya, mut] of SLUCHAI) {
  const w = mut(czyste());
  const { bledy } = await sverka(w);
  console.log(`== ${imya}\n   судья: ${bledy.length ? `ОТКАЗ (${bledy.length}): ${bledy.map((b) => b.slice(0, 220)).join(' | ')}` : 'СВЕРЕНО'}`);
  try {
    const out = await vyvod(w.css);
    const importy = drzewoCss(out).uzly.filter((u) => u.oper).map((u) => u.prelude);
    const fd = deklaracje(drzewoCss(out).uzly).filter((d) => d.imie === 'font-display').map((d) => `${d.gde}: ${d.wartosc}`);
    const prop = [...out.matchAll(/@property\s+--font-display[^}]*}/g)].map((m) => m[0].replace(/\s+/g, ' '));
    const ff = [...out.matchAll(/@font-face\s*{[^}]*Bodoni Moda[^}]*}/g)].map((m) => m[0].replace(/\s+/g, ' ').slice(0, 260));
    console.log(`   вывод пути сборки: операторы ${JSON.stringify(importy)}; --font-display: ${JSON.stringify(fd)}`);
    if (prop.length) console.log(`   @property в выводе: ${JSON.stringify(prop)}`);
    if (ff.length > 1) console.log(`   @font-face Bodoni в выводе: ${JSON.stringify(ff)}`);
    if (/@import/.test(out)) console.log(`   @import в выводе: ${JSON.stringify(out.match(/@import[^;]*;/g))}`);
  } catch (e) {
    console.log(`   вывод пути сборки: исключение ${String(e.message).split('\n')[0]}`);
  }
}
