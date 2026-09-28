// Раунд 2, линза «класс», опыт 2: (А7) @import url() первым в global.css — Tailwind оставляет оператор, судья
// операторы вывода не судит; (Д) сторож sayt:znak-dist на папке сборки, чей CSS страницы переопределяет --font-display.
//   node opyt2.mjs > opyt2.txt
import { writeFileSync, mkdirSync, mkdtempSync, readFileSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const REF = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/ref/dist-7th-3b78f28';
const ZNAK = 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs';
const { default: znakDist, sverka, wejscie, drzewoCss } = await import(ZNAK);
const PAPKA = import.meta.dirname;
const LISTY = join(PAPKA, 'listy');
mkdirSync(LISTY, { recursive: true });
const put = (p) => p.replace(/\\/g, '/');

const require = createRequire(join(SAYT, 'package.json'));
const viteReq = createRequire(require.resolve('@tailwindcss/vite'));
const twNode = await import(pathToFileURL(viteReq.resolve('@tailwindcss/node')).href);
const { Scanner } = await import(pathToFileURL(viteReq.resolve('@tailwindcss/oxide')).href);
async function vyvod(css, minify) {
  const cssPut = join(SAYT, 'src/styles/global.css');
  const c = await twNode.compile(css, { base: dirname(cssPut), from: cssPut, shouldRewriteUrls: true, onDependency: () => {} });
  const ist = (c.root === 'none' ? [] : c.root === null ? [{ base: SAYT, pattern: '**/*', negated: false }] : [{ ...c.root, negated: false }]).concat(c.sources);
  const k = c.features & twNode.Features.Utilities ? new Scanner({ sources: ist }).scan() : [];
  return twNode.optimize(c.build(k), { minify }).code;
}

const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
const zlo = join(LISTY, 'zlo-a7.css');
writeFileSync(zlo, ":root { --font-display: Georgia, serif; }\n");

for (const [imya, css] of [
  ['А7 @import url() первым в global.css', `@import url('${put(zlo)}');\n${baza.css}`],
  ['А8 @import "https://…" первым в global.css', `@import "https://fonts.example.net/zlo.css";\n${baza.css}`],
  ['А9 @import url() после @import tailwindcss', baza.css.replace("@import 'tailwindcss' source('../../src');", `@import 'tailwindcss' source('../../src');\n@import url('${put(zlo)}');`)],
]) {
  const w = czyste();
  w.css = css;
  const { bledy } = await sverka(w);
  console.log(`== ${imya}\n   судья: ${bledy.length ? `ОТКАЗ: ${bledy.join(' | ').slice(0, 300)}` : 'СВЕРЕНО'}`);
  for (const minify of [false, true]) {
    const out = await vyvod(w.css, minify);
    const oper = drzewoCss(out).uzly.filter((u) => u.oper).map((u) => u.prelude);
    console.log(`   вывод (minify ${minify}): операторы верхнего уровня ${JSON.stringify(oper)}; первые 160 знаков: ${JSON.stringify(out.slice(0, 160))}`);
  }
}

// Д. Сторож сборки: папка = иконки эталонной сборки + CSS страницы и <style> в HTML с --font-display: Georgia.
const d = mkdtempSync(join(PAPKA, 'dist-'));
try {
  for (const f of ['favicon.svg', 'favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'icon-192.png', 'apple-touch-icon.png']) copyFileSync(join(REF, f), join(d, f));
  mkdirSync(join(d, '_astro'));
  const cssRef = readFileSync(join(REF, '_astro/index.Cz6femgl.css'), 'utf8');
  writeFileSync(join(d, '_astro/index.Cz6femgl.css'), `${cssRef}\n:root{--font-display:Georgia,serif}\n@property --font-display{syntax:"*";inherits:false}\n`);
  writeFileSync(join(d, 'index.html'), '<!doctype html><html style="--font-display: Georgia"><head><link rel="stylesheet" href="/_astro/index.Cz6femgl.css"><style>:root{--font-display:Georgia,serif}</style></head><body><h1 class="t-headline">x</h1></body></html>');
  const integ = znakDist();
  const zhurnal = [];
  const logger = { error: (s) => zhurnal.push(`error: ${s}`), info: (s) => zhurnal.push(`info: ${s}`) };
  try {
    await integ.hooks['astro:build:done']({ dir: pathToFileURL(d + '/'), logger });
    console.log(`== Д сторож sayt:znak-dist на сборке с CSS страницы --font-display: Georgia\n   сторож: ПРОШЁЛ — ${zhurnal.join(' | ')}`);
  } catch (e) {
    console.log(`== Д сторож: ОТКАЗ — ${String(e.message).slice(0, 300)}`);
  }
} finally {
  rmSync(d, { recursive: true, force: true });
}
