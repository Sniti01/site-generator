// Раунд 2, опыт 4: те же входы Г2–Г4 и Б1–Б2, но optimize с minify: true — как у плагина @tailwindcss/vite в сборке
// (build.cssMinify не выключен). Показать, что вложенное @property и своя @font-face доходят до страницы.
//   node opyt4.mjs > opyt4.txt
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const { wejscie } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs');
const LISTY = join(import.meta.dirname, 'listy');
mkdirSync(LISTY, { recursive: true });
const put = (p) => p.replace(/\\/g, '/');
const require = createRequire(join(SAYT, 'package.json'));
const viteReq = createRequire(require.resolve('@tailwindcss/vite'));
const twNode = await import(pathToFileURL(viteReq.resolve('@tailwindcss/node')).href);
const { Scanner } = await import(pathToFileURL(viteReq.resolve('@tailwindcss/oxide')).href);
async function vyvod(css) {
  const cssPut = join(SAYT, 'src/styles/global.css');
  const c = await twNode.compile(css, { base: dirname(cssPut), from: cssPut, shouldRewriteUrls: true, onDependency: () => {} });
  const ist = (c.root === 'none' ? [] : c.root === null ? [{ base: SAYT, pattern: '**/*', negated: false }] : [{ ...c.root, negated: false }]).concat(c.sources);
  const k = c.features & twNode.Features.Utilities ? new Scanner({ sources: ist }).scan() : [];
  return twNode.optimize(c.build(k), { minify: true }).code;
}
const baza = wejscie();
const POSLE_YADRA = "@import '@factory/core/styles/a11y.css';";
let n = 0;
for (const [imya, tekst, iskat] of [
  ['Г2 @layer base', "@layer base { @property --font-display { syntax: '*'; inherits: false; } }\n", /@layer base\{@property --font-display\{[^}]*\}\}/],
  ['Г3 @supports', "@supports (display: grid) { @property --font-display { syntax: '*'; inherits: false; } }\n", /@supports \(display:grid\)\{@property --font-display\{[^}]*\}\}/],
  ['Г4 @media all', "@media all { @property --font-display { syntax: '*'; inherits: false; } }\n", /@property --font-display\{[^}]*\}/],
  ['Б1 local(Georgia)', "@font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: local('Georgia'), url('/@fontsource/bodoni-moda/files/bodoni-moda-latin-600-normal.woff2') format('woff2'); }\n", /@font-face\{font-family:Bodoni Moda;font-weight:600;src:local\(Georgia\)[^}]*\}/],
  ['Б2 другой хост', "@font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: url(https://cdn.example.net/@fontsource/bodoni-moda/files/bodoni-moda-latin-600-normal.woff2) format('woff2'); }\n", /@font-face\{font-family:Bodoni Moda;font-weight:600;src:url\(https:[^}]*\}/],
]) {
  const f = join(LISTY, `m${++n}.css`);
  writeFileSync(f, tekst);
  const out = await vyvod(baza.css.replace(POSLE_YADRA, `${POSLE_YADRA}\n@import '${put(f)}';`));
  const m = out.match(iskat);
  console.log(`== ${imya}: на странице (minify) ${m ? JSON.stringify(m[0]) : 'НЕТ'}; @property --font-display верхнего уровня с запасным значением: ${/--font-display:initial/.test(out) ? 'есть' : 'нет'}`);
}
