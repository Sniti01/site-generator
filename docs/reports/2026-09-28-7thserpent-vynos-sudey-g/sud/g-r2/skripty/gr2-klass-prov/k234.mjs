// Проверка GR2-K-2, K-3, K-4 и свой член класса: @property/своя @font-face/другие источники CSS страницы мимо судьи.
// Мутации — в памяти (w.css), листы, разметка и папка «сборки» — в своей папке; репозиторий не меняется.
import { writeFileSync, mkdirSync, mkdtempSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const REF = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const { sverka, wejscie, drzewoCss, deklaracje } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs');
const PAPKA = import.meta.dirname;
const LISTY = join(PAPKA, 'listy');
mkdirSync(LISTY, { recursive: true });
const put = (p) => p.replace(/\\/g, '/');

const require = createRequire(join(SAYT, 'package.json'));
const viteReq = createRequire(require.resolve('@tailwindcss/vite'));
const twNode = await import(pathToFileURL(viteReq.resolve('@tailwindcss/node')).href);
const { Scanner } = await import(pathToFileURL(viteReq.resolve('@tailwindcss/oxide')).href);
const cssPut = join(SAYT, 'src/styles/global.css');
async function tw(css, minify) {
  const c = await twNode.compile(css, { base: dirname(cssPut), from: cssPut, shouldRewriteUrls: true, onDependency: () => {} });
  const ist = (c.root === 'none' ? [] : c.root === null ? [{ base: SAYT, pattern: '**/*', negated: false }] : [{ ...c.root, negated: false }]).concat(c.sources);
  const k = c.features & twNode.Features.Utilities ? new Scanner({ sources: ist }).scan() : [];
  return twNode.optimize(c.build(k), { minify }).code;
}

const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
const POSLE = "@import '@factory/core/styles/a11y.css';";
let n = 0;
const list = (t) => { const f = join(LISTY, `p${++n}.css`); writeFileSync(f, t); return put(f); };
const sListom = (css, t) => css.replace(POSLE, `${POSLE}\n@import '${list(t)}';`);
const sRazmetkoy = (css, html) => {
  const d = mkdtempSync(join(LISTY, 'm-'));
  writeFileSync(join(d, 'x.astro'), html);
  return css.replace("@import 'tailwindcss' source('../../src');", `@import 'tailwindcss' source('../../src');\n@source '${put(d)}';`);
};
const TEMA = put(join(dirname(require.resolve('@fontsource/bodoni-moda/latin-600.css')), 'files', 'bodoni-moda-latin-600-normal.woff2'));
const PR = "@property --font-display { syntax: '*'; inherits: false; }";

const SLUCHAI = [
  ['контроль: чистые', (c) => c],
  // K-2
  ['K2 контроль: @property --font-display верх импорта', (c) => sListom(c, `${PR}\n`)],
  ['K2 @layer base { @property } в импорте', (c) => sListom(c, `@layer base { ${PR} }\n`)],
  ['K2 @supports { @property } в импорте', (c) => sListom(c, `@supports (display: grid) { ${PR} }\n`)],
  ['K2 @media all { @property } в импорте', (c) => sListom(c, `@media all { ${PR} }\n`)],
  // K-3
  ['K3 local(Georgia) перед файлом темы', (c) => sListom(c, `@font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: local('Georgia'), url('${TEMA}') format('woff2'); }\n`)],
  ['K3 то же имя файла на другом хосте', (c) => sListom(c, "@font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: url(https://cdn.example.net/@fontsource/bodoni-moda/files/bodoni-moda-latin-600-normal.woff2) format('woff2'); }\n")],
  ['K3 контроль: только local(Georgia)', (c) => sListom(c, "@font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: local('Georgia'); }\n")],
  ['K3+ свой: два src, последний local(Georgia)', (c) => sListom(c, `@font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: url('${TEMA}') format('woff2'); src: local('Georgia'); }\n`)],
  // K-4 (разметка в зоне @source)
  ['K4 <style is:global> :root --font-display в компоненте', (c) => sRazmetkoy(c, '<h2 class="t-headline">x</h2>\n<style is:global>:root { --font-display: Georgia, serif; }</style>\n')],
  ['K4 style="--font-display: Georgia"', (c) => sRazmetkoy(c, '<html style="--font-display: Georgia, serif"><h2 class="t-headline">x</h2></html>\n')],
  ['K4 контроль: [--font-display:Georgia] произвольное свойство', (c) => sRazmetkoy(c, '<h2 class="t-headline [--font-display:Georgia]">x</h2>\n')],
  // Свой член класса: комментарий между @property и именем (браузер читает @property + имя, разбор сверки клеит)
  ['СВОЙ @property/**/--accent в global.css', (c) => `${c}\n@property/**/--accent { syntax: '<color>'; inherits: false; initial-value: #ff0000; }\n`],
  ['СВОЙ контроль: @property --accent в global.css', (c) => `${c}\n@property --accent { syntax: '<color>'; inherits: false; initial-value: #ff0000; }\n`],
  ['СВОЙ @property/**/--font-display в global.css', (c) => `${c}\n@property/**/--font-display { syntax: '*'; inherits: false; }\n`],
  ['СВОЙ @font-face font-family: Bodoni/**/Moda в global.css', (c) => `${c}\n@font-face { font-family: Bodoni/**/Moda; font-weight: 600; src: local('Georgia'); }\n`],
  ['СВОЙ @font-face font-family: Bodoni/**/Moda в импорте', (c) => sListom(c, "@font-face { font-family: Bodoni/**/Moda; font-weight: 600; src: local('Georgia'); }\n")],
];

for (const [imya, mut] of SLUCHAI) {
  const w = czyste();
  w.css = mut(w.css);
  const { bledy } = await sverka(w);
  console.log(`== ${imya}\n   судья: ${bledy.length ? `ОТКАЗ (${bledy.length}): ${bledy.map((b) => b.slice(0, 200)).join(' | ')}` : 'СВЕРЕНО'}`);
  for (const minify of [false, true]) {
    try {
      const out = await tw(w.css, minify);
      const fd = deklaracje(drzewoCss(out).uzly).filter((d) => d.imie === 'font-display').map((d) => d.wartosc);
      const acc = deklaracje(drzewoCss(out).uzly).filter((d) => d.imie === 'accent').map((d) => `${d.gde}: ${d.wartosc}`);
      const prop = [...out.matchAll(/@property[^{]*--(font-display|accent)[^}]*}/g)].map((m) => m[0].replace(/\s+/g, ' '));
      const ctx = prop.length ? out.slice(Math.max(0, out.search(/@property[^{]*--(font-display|accent)/) - 60), out.search(/@property[^{]*--(font-display|accent)/)).replace(/\s+/g, ' ') : '';
      const ff = [...out.matchAll(/@font-face\s*{[^}]*Bodoni[^}]*}/gi)].map((m) => m[0].replace(/\s+/g, ' ').slice(0, 200));
      console.log(`   Tailwind minify=${minify}: --font-display ${JSON.stringify(fd)}; --accent ${JSON.stringify(acc)}`);
      if (prop.length) console.log(`     @property ${JSON.stringify(prop)}; перед ним: ${JSON.stringify(ctx)}`);
      if (ff.length > 1) console.log(`     @font-face Bodoni ${JSON.stringify(ff)}`);
      if (/<style|style=/.test(out)) console.log('     в выводе есть разметка');
    } catch (e) {
      console.log(`   исключение: ${String(e.message).split('\n')[0]}`);
    }
  }
}

// K-4, сторож: папка «сборки» с иконками эталона, CSS и HTML с --font-display: Georgia.
const DIST = mkdtempSync(join(PAPKA, 'dist-'));
for (const f of ['favicon.svg', 'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'icon-192.png', 'apple-touch-icon.png']) copyFileSync(join(REF, f), join(DIST, f));
mkdirSync(join(DIST, '_astro'));
writeFileSync(join(DIST, '_astro', 'x.css'), ':root{--font-display:Georgia,serif}@property --font-display{syntax:"*";inherits:false}@font-face{font-family:"Bodoni Moda";src:local(Georgia)}');
writeFileSync(join(DIST, 'index.html'), '<html style="--font-display: Georgia"><head><link rel="stylesheet" href="/_astro/x.css"><style>:root{--font-display:Georgia,serif}</style></head><body><h1 class="t-headline">x</h1></body></html>');
const wd = wejscie({ dist: DIST });
const r = await sverka(wd);
console.log(`== K4 сторож (sverka с dist = своя папка ${put(DIST)}): ${r.bledy.length ? `ОТКАЗ: ${r.bledy.join(' | ')}` : 'СВЕРЕНО'}; иконок dist прочитано: ${wd.dist.size}`);
