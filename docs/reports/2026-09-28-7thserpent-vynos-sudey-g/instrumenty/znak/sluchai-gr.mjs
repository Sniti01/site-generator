// Случаи «судью судят» блока Г (GR1, GR2, GR3) для сверки вердиктов: те же входы, что в тестах tools/testy/znak.test.mjs,
// с ожиданием теста («отказ» или «сверено»). Старый судья (3b78f28) и новый судят их одинаково собранными входами.
//   import { sluchaiGr } from './sluchai-gr.mjs'; sluchaiGr() → [[имя, мутация входов, ожидание], …]
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const req = createRequire(join(SAYT, 'package.json'));
const IMPORT_GARNITURY = '@fontsource/bodoni-moda/latin-600.css';
const I = `@import '${IMPORT_GARNITURY}';`;
const IMPORT_TW = "@import 'tailwindcss' source('../../src');";
const POSLE_YADRA = "@import '@factory/core/styles/a11y.css';";
const YAD_KANDIDAT = ['[', '--font-', 'display:Georgia', ']'].join('');
const put = (p) => p.replace(/\\/g, '/');
const vremennaya = () => mkdtempSync(join(tmpdir(), 'znak-sverka-gr-'));
function zamenitStroku(s, iz, na) {
  const n = s.split(iz).length - 1;
  if (n !== 1) throw new Error(`порча: «${iz.slice(0, 60)}» встречается ${n} раз, а нужен один`);
  return s.replace(iz, () => na);
}
const sListom = (w, tekst) => {
  const d = vremennaya();
  writeFileSync(join(d, 'list.css'), tekst);
  return { ...w, css: zamenitStroku(w.css, POSLE_YADRA, `${POSLE_YADRA}\n@import '${put(join(d, 'list.css'))}';`) };
};
const sRazmetkoy = (w, html) => {
  const d = vremennaya();
  writeFileSync(join(d, 'x.html'), html);
  return { ...w, css: zamenitStroku(w.css, IMPORT_TW, `${IMPORT_TW}\n@source '${put(d)}';`) };
};
const css = (f) => (w) => ({ ...w, css: f(w.css) });
const spisok = (v) => css((c) => c.replace(/--font-display:[^;]*;/, `--font-display: ${v};`));
const posleTemy = (f) => css((c) => zamenitStroku(c, I, `${I}\n@import '@fontsource/bodoni-moda/${f}';`));
const pered = (f) => css((c) => zamenitStroku(c, I, `@import '@fontsource/bodoni-moda/${f}';\n${I}`));
const viteReq = createRequire(req.resolve('@tailwindcss/vite'));
const twNode = await import(pathToFileURL(viteReq.resolve('@tailwindcss/node')).href);
const GLOBAL_CSS = join(SAYT, 'src/styles/global.css');
const c = await twNode.compile(`@import '${IMPORT_GARNITURY}';`, { base: dirname(GLOBAL_CSS), from: GLOBAL_CSS, shouldRewriteUrls: true, onDependency: () => {} });
const GRAN_TEMY = /@font-face \{[^}]*\}/.exec(twNode.optimize(c.build([]), { minify: false }).code)[0];
const FAYL_TEMY = put(join(dirname(req.resolve(IMPORT_GARNITURY)), 'files', 'bodoni-moda-latin-600-normal.woff2'));

export function sluchaiGr() {
  const d = vremennaya();
  writeFileSync(join(d, 'zlo.css'), ':root { --font-display: Georgia, serif; }\n');
  writeFileSync(join(d, 'plagin.mjs'), 'export default function () {}\n');
  writeFileSync(join(d, 'fake-600.css'), "@font-face { font-family: 'Bodoni Moda'; font-style: normal; font-weight: 600; src: local('Georgia'); }\n");
  writeFileSync(join(d, 'postcss.config.mjs'), 'export default { plugins: [] };\n');
  const pkg = join(d, 'node_modules', 'pkg-import');
  mkdirSync(pkg, { recursive: true });
  writeFileSync(join(pkg, 'package.json'), JSON.stringify({ name: 'pkg-import', version: '1.0.0', exports: { './list.css': { import: './zlo.css', style: './dobro.css' } } }));
  writeFileSync(join(pkg, 'zlo.css'), ':root { --font-display: Georgia, serif; }\n');
  writeFileSync(join(pkg, 'dobro.css'), '.dobro { color: green; }\n');
  writeFileSync(join(d, 'pkg-list.css'), "@import 'pkg-import/list.css';\n");
  const S = [
    // GR1 — пропуски и законные листы раунда 1
    ['GR1-K-1 произвольное свойство --font-display в разметке', (w) => sRazmetkoy(w, `<p class="${YAD_KANDIDAT}">x</p>`), 'отказ'],
    ['GR1-K-1 @utility с --font-display в импорте и класс в разметке', (w) => sRazmetkoy(sListom(w, '@utility zag-x { --font-display: Georgia; }\n'), '<p class="zag-x">x</p>'), 'отказ'],
    ["GR1-K-2 в @theme импорта 'Bodoni Moda', 10px", (w) => sListom(w, "@theme { --font-display: 'Bodoni Moda', 10px; }\n"), 'отказ'],
    ['GR1-K-3 экранированное имя в импорте --font-displ\\61y', (w) => sListom(w, ':root { --font-displ\\61y: Georgia, serif; }\n'), 'отказ'],
    ['GR1-K-4 своя @font-face Бодони в импорте', (w) => sListom(w, "@font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: url(x.woff2); }\n"), 'отказ'],
    ['GR1-K-5 CDO перед @property --accent', css((x) => `${x}\n<!-- @property --accent { syntax: '<color>'; inherits: false; initial-value: red; }`), 'отказ'],
    ['GR1-K-5 CDC перед правилом', css((x) => `${x}\n--> .x { color: red; }`), 'отказ'],
    ['GR1-Z-1 подпути tailwindcss без .css', css((x) => zamenitStroku(x, IMPORT_TW, "@import 'tailwindcss/theme' layer(theme);\n@import 'tailwindcss/preflight' layer(base);\n@import 'tailwindcss/utilities' layer(utilities) source('../../src');")), 'сверено'],
    ['GR1-Z-2 @plugin', css((x) => zamenitStroku(x, IMPORT_TW, `${IMPORT_TW}\n@plugin '${put(join(d, 'plagin.mjs'))}';`)), 'сверено'],
    ['GR1-Z-4 сброс и повторное объявление в позднем @theme', css((x) => `${x}\n@theme { --font-*: initial; --font-display: 'Bodoni Moda', serif; }`), 'сверено'],
    ['GR1-Z-5 строка content со словами --font-display', css((x) => `${x}\n.otladka::after { content: "--font-display: serif;"; }`), 'сверено'],
    ['GR1-Z-7 @import несуществующего листа', css((x) => zamenitStroku(x, POSLE_YADRA, `${POSLE_YADRA}\n@import './net-takogo-lista.css';`)), 'отказ'],
    // GR2 — пропуски и законные листы раунда 2
    ['GR2-K-1 @import url() в начале листа', css((x) => `@import url('${put(join(d, 'zlo.css'))}');\n${x}`), 'отказ'],
    ['GR2-K-1 удалённый @import в начале листа', css((x) => `@import "https://fonts.example.net/zlo.css";\n${x}`), 'отказ'],
    ['GR2-K-2 @property --font-display в @layer base импорта', (w) => sListom(w, "@layer base { @property --font-display { syntax: '*'; inherits: false; } }\n"), 'отказ'],
    ["GR2-K-3 local('Georgia') перед файлом темы", (w) => sListom(w, `@font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: local('Georgia'), url('${FAYL_TEMY}') format('woff2'); }\n`), 'отказ'],
    ['GR2-K-3 файл с тем же именем на другом хосте', (w) => sListom(w, "@font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: url(https://cdn.example.net/@fontsource/bodoni-moda/files/bodoni-moda-latin-600-normal.woff2); }\n"), 'отказ'],
    ['GR2-K-3 файлы 700 под весом 600 в global.css', css((x) => `${x}\n${GRAN_TEMY.replaceAll('latin-600-normal', 'latin-700-normal')}`), 'отказ'],
    ['GR2-Z-1 после темы latin-400.css', posleTemy('latin-400.css'), 'сверено'],
    ['GR2-Z-1 после темы latin-600-italic.css', posleTemy('latin-600-italic.css'), 'сверено'],
    ['GR2-Z-1 после темы latin-ext-600.css (контроль проверяющего)', posleTemy('latin-ext-600.css'), 'отказ'],
    ['GR2-Z-1 перед темой latin-ext-600.css', pered('latin-ext-600.css'), 'сверено'],
    ['GR2-Z-1 импорт гарнитуры с media и яд в разметке', (w) => sRazmetkoy(css((x) => zamenitStroku(x, I, `@import '${IMPORT_GARNITURY}' screen;`))(w), `<p class="${YAD_KANDIDAT}">x</p>`), 'отказ'],
    ['GR2-Z-3 строка с «-->» в селекторе', css((x) => `${x}\n.q[data-strelka="-->"] { color: red; }`), 'сверено'],
    ['GR2-Z-3 имя «a--» перед «>»', css((x) => `${x}\n.a-->.b { color: red; }`), 'сверено'],
    ["GR2-Z-4 своя грань только с local('Georgia') в импорте", (w) => sListom(w, "@font-face { font-family: 'Bodoni Moda'; font-style: normal; font-weight: 600; src: local('Georgia'); }\n"), 'отказ'],
    ['GR2-Z-5 source(none) и @source на src', css((x) => zamenitStroku(x, IMPORT_TW, "@import 'tailwindcss' source(none);\n@source '../../src';")), 'сверено'],
    ['GR2-Z-6 значение-блок в импорте', (w) => sListom(w, ':root { --x: { a: b }; }\n'), 'отказ'],
    // GR3 — пропуски и законные листы раунда 3 (последнего)
    ['GR3-K-1 весь tailwindcss с print', css((x) => zamenitStroku(x, IMPORT_TW, "@import 'tailwindcss' source('../../src') print;")), 'отказ'],
    ['GR3-K-1 тема Tailwind отдельным импортом с supports(display: nonsense)', css((x) => zamenitStroku(x, IMPORT_TW, "@layer theme, base, components, utilities;\n@import 'tailwindcss/theme.css' layer(theme) supports(display: nonsense);\n@import 'tailwindcss/preflight.css' layer(base);\n@import 'tailwindcss/utilities.css' layer(utilities) source('../../src');")), 'отказ'],
    ['GR3-K-2 псевдоним Vite на лист гарнитуры с local(Georgia)', (w) => ({ ...w, vite: { resolve: { alias: [{ find: IMPORT_GARNITURY, replacement: put(join(d, 'fake-600.css')) }] }, plugins: [] } }), 'отказ'],
    ['GR3-K-2 PostCSS в корне Vite', (w) => ({ ...w, korenVite: d }), 'отказ'],
    ['GR3-Z-2 пакет с exports import → zlo, style → dobro', (w) => ({ ...w, css: zamenitStroku(w.css, POSLE_YADRA, `${POSLE_YADRA}\n@import '${put(join(d, 'pkg-list.css'))}';`) }), 'отказ'],
    ["GR3-K-3 'Bodoni Moda', serif Georgia", spisok("'Bodoni Moda', serif Georgia"), 'отказ'],
    ["GR3-K-3 'Bodoni Moda', Georgia serif", spisok("'Bodoni Moda', Georgia serif"), 'сверено'],
    ["GR3-Z-1 'Bodoni Moda', var(--font-serif)", spisok("'Bodoni Moda', var(--font-serif)"), 'сверено'],
    ["GR3-Z-1 'Bodoni Moda', var(--net-takogo)", spisok("'Bodoni Moda', var(--net-takogo)"), 'отказ'],
  ];
  return S;
}
