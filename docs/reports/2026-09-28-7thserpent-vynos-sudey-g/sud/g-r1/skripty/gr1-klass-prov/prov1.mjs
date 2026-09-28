// Проверка находок gr1-klass (раунд 1, блок Г): судья знака в памяти + конвейер страницы
// compile() -> build(кандидаты) -> optimize() @tailwindcss/node (как @tailwindcss/vite в сборке) -> esbuild minify.
// Импортированный лист — СВОЙ файл в listy/, подключается строкой @import сразу после импорта base.css ядра
// (base.css не трогается; репозиторий только читается).
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const TUT = dirname(fileURLToPath(import.meta.url));
const { sverka, wejscie, drzewoCss } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs');
const req = createRequire(join(SAYT, 'package.json'));
const tw = await import(pathToFileURL(req.resolve('tailwindcss')).href);
const twCompile = tw.compile ?? tw.default?.compile;
const twNode = await import(pathToFileURL(req.resolve('@tailwindcss/node')).href);
const esbuild = req('esbuild');
const TWP = dirname(req.resolve('tailwindcss/package.json'));
const CSS_PUT = join(SAYT, 'src/styles/global.css');
const nayti = (id, base) => {
  if (id.startsWith('.') || id.startsWith('/')) return resolve(base, id);
  if (id === 'tailwindcss') return join(TWP, 'index.css');
  if (id.startsWith('tailwindcss/')) return join(TWP, id.slice('tailwindcss/'.length));
  return createRequire(join(base, 'x.js')).resolve(id);
};
async function stranica(css, kand) {
  const c = await twCompile(css, {
    base: dirname(CSS_PUT), from: CSS_PUT,
    loadStylesheet: async (id, base) => { const f = nayti(id, base); return { path: f, base: dirname(f), content: readFileSync(f, 'utf8') }; },
    onDependency: () => {},
  });
  const syroj = c.build(kand);
  const opt = twNode.optimize(syroj, { minify: true }).code;
  const gotovo = (await esbuild.transform(opt, { loader: 'css', minify: true })).code;
  return { syroj, gotovo };
}

const baza = wejscie();
const { pliki, bledy: b0 } = await sverka({ ...baza, publiczne: null });
if (b0.length) throw new Error('контроль не сверен: ' + b0.join(' | '));
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
const BASE_IMPORT = "@import '@factory/core/styles/base.css';";
const svoiList = (imya, txt) => (w) => {
  const f = join(TUT, 'listy', `${imya}.css`).replace(/\\/g, '/');
  writeFileSync(f, txt + '\n');
  if (!w.css.includes(BASE_IMPORT)) throw new Error('нет импорта base.css');
  w.css = w.css.replace(BASE_IMPORT, `${BASE_IMPORT}\n@import '${f}';`);
  return w;
};
const dop = (txt) => (w) => { w.css += '\n' + txt; return w; };

const SLUCHAI = [
  ['K0 контроль', (w) => w, []],
  ['K0б контроль: свой пустой импортированный лист', svoiList('pusto', '/* pusto */'), []],
  ['K1а кандидат [--font-display:Georgia] (разметка)', (w) => w, ['[--font-display:Georgia]']],
  ['K1б импортированный лист: @utility с --font-display + кандидат', svoiList('utility', '@utility zag-x { --font-display: Georgia; }'), ['zag-x']],
  ['K1в контроль того же @utility без кандидата', svoiList('utility', '@utility zag-x { --font-display: Georgia; }'), []],
  ['K2а импортированный лист: @theme --font-display: Bodoni Moda, 10px', svoiList('theme-10px', "@theme { --font-display: 'Bodoni Moda', 10px; }"), []],
  ['K2б импортированный лист: :root --font-display: Bodoni Moda,, serif', svoiList('root-pusto', ":root { --font-display: 'Bodoni Moda',, serif; }"), []],
  ['K2в импортированный лист: @theme --font-display: Bodoni Moda, initial', svoiList('theme-initial', "@theme { --font-display: 'Bodoni Moda', initial; }"), []],
  ['K3а импортированный лист: :root --font-displ\\61y: Georgia', svoiList('ekran61', ':root { --font-displ\\61y: Georgia, serif; }'), []],
  ['K3б контроль: импортированный :root --font-display: Georgia (без экранирования)', svoiList('bez-ekrana', ':root { --font-display: Georgia, serif; }'), []],
  ['K4 импортированный лист: своя @font-face Bodoni Moda 600', svoiList('fontface', "@font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: url(x.woff2); }"), []],
  ['K5а global.css: CDO перед @property --accent', dop("<!-- @property --accent { syntax: '<color>'; inherits: false; initial-value: #ff0000; }"), []],
  ['K5б global.css: CDO перед @font-face Bodoni', dop("<!-- @font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: url(x.woff2); }"), []],
  ['K5в контроль: @property --accent без CDO', dop("@property --accent { syntax: '<color>'; inherits: false; initial-value: #ff0000; }"), []],
  ['K6 global.css: .t-headline { font-family: Georgia }', dop('.t-headline { font-family: Georgia, serif; }'), []],
  // Свои члены класса (скептик не пробовал):
  ['M1а global.css: CDC --> перед @property --accent', dop("--> @property --accent { syntax: '<color>'; inherits: false; initial-value: #ff0000; }"), []],
  ['M1б global.css: CDC --> перед @font-face Bodoni', dop("--> @font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: url(x.woff2); }"), []],
  ['M2 импортированный лист: :root \\2d-font-display: Georgia', svoiList('ekran2d', ':root { \\2d-font-display: Georgia, serif; }'), []],
  ['M3 импортированный лист: :root --font-d\\69splay (прописное экранирование другой буквы)', svoiList('ekran69', ':root { --font-d\\69splay: Georgia, serif; }'), []],
];

const vzyat = (t, re) => [...t.matchAll(re)].map((m) => m[0].replace(/\s+/g, ' '));
for (const [imya, mut, kand] of SLUCHAI) {
  const w = mut(czyste());
  const { bledy } = await sverka(w);
  const dr = drzewoCss(w.css);
  let s;
  try { s = await stranica(w.css, kand); } catch (e) { console.log(`\n=== ${imya}\nсудья: ${bledy.length ? 'ОТКАЗ' : 'СВЕРЕНО'}\nконвейер бросил: ${String(e.message).split('\n')[0]}`); continue; }
  console.log(`\n=== ${imya}`);
  console.log(`судья: ${bledy.length ? 'ОТКАЗ — ' + bledy.join(' | ') : 'СВЕРЕНО'}`);
  console.log(`разбор судьи: ошибок ${dr.bledy.length}; последний узел верхнего уровня: ${JSON.stringify({ tip: dr.uzly.at(-1)?.tip, prelude: dr.uzly.at(-1)?.prelude })}`);
  console.log(`build(${JSON.stringify(kand)}), сырой: --font-displ*: ${JSON.stringify(vzyat(s.syroj, /[^\n;{}]{0,30}(?:--font-displ|\\2d-font|--font-d\\)[^;}]*[;}]/g))}`);
  console.log(`страница (optimize+esbuild): --font-display: ${JSON.stringify(vzyat(s.gotovo, /[^;{}]{0,40}--font-display[^;}]*[;}]/g))}`);
  console.log(`страница: @font-face Bodoni: ${JSON.stringify(vzyat(s.gotovo, /@font-face\{[^}]*\}/g).filter((t) => /bodoni/i.test(t)).map((t) => t.slice(0, 110)))}`);
  console.log(`страница: @property --accent: ${JSON.stringify(vzyat(s.gotovo, /.{0,6}@property --accent\{[^}]*\}/g))}; .t-headline: ${JSON.stringify(vzyat(s.gotovo, /\.t-headline\{font-family:[^;}]*/g))}`);
}
