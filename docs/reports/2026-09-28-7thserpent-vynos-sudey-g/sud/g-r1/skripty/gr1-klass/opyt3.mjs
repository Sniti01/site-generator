// Опыт: что остаётся на странице после конвейера сборки — compile() → build(кандидаты) → optimize() @tailwindcss/node
// (lightningcss, как делает @tailwindcss/vite в сборке) → минификация esbuild (Vite). Входы — порченые листы из opyt1.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const TUT = dirname(fileURLToPath(import.meta.url));
const req = createRequire(join(SAYT, 'package.json'));
const tw = await import(pathToFileURL(req.resolve('tailwindcss')).href);
const twCompile = tw.compile ?? tw.default?.compile;
const node = await import(pathToFileURL(req.resolve('@tailwindcss/node')).href);
const esbuild = req('esbuild');
const TWP = dirname(req.resolve('tailwindcss/package.json'));
const CSS_PUT = join(SAYT, 'src/styles/global.css');
const nayti = (id, base) => {
  if (id.startsWith('.') || id.startsWith('/')) return resolve(base, id);
  if (id === 'tailwindcss') return join(TWP, 'index.css');
  if (id.startsWith('tailwindcss/')) return join(TWP, id.slice('tailwindcss/'.length));
  return createRequire(join(base, 'x.js')).resolve(id);
};
async function konvejer(css, kand = []) {
  const c = await twCompile(css, {
    base: dirname(CSS_PUT), from: CSS_PUT,
    loadStylesheet: async (id, base) => { const f = nayti(id, base); return { path: f, base: dirname(f), content: readFileSync(f, 'utf8') }; },
    onDependency: () => {},
  });
  const surovyj = c.build(kand);
  const opt = node.optimize(surovyj, { minify: true }).code;
  const esb = (await esbuild.transform(opt, { loader: 'css', minify: true })).code;
  return esb;
}
const css0 = readFileSync(CSS_PUT, 'utf8');
const BASE_IMPORT = "@import '@factory/core/styles/base.css';";
const baseCss = readFileSync(req.resolve('@factory/core/styles/base.css'), 'utf8');
const vImporte = (imya, dobavka) => {
  const f = join(TUT, `base-${imya}.css`).replace(/\\/g, '/');
  writeFileSync(f, baseCss + '\n' + dobavka + '\n');
  return css0.split(BASE_IMPORT).join(`@import '${f}';`);
};
const SLUCHAI = [
  ['0 контроль', css0, []],
  ['1 кандидат [--font-display:Georgia]', css0, ['[--font-display:Georgia]']],
  ['2б лист ядра: @theme --font-display: Bodoni Moda, 10px', vImporte('spisok-theme', "@theme { --font-display: 'Bodoni Moda', 10px; }"), []],
  ['3 лист ядра: своя @font-face Bodoni', vImporte('fontface', "@font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: url(x.woff2); }"), []],
  ['4 лист ядра: --font-displ\\61y', vImporte('ekran', ':root { --font-displ\\61y: Georgia, serif; }'), []],
  ['6 CDO перед @property --accent', css0 + "\n<!-- @property --accent { syntax: '<color>'; inherits: false; initial-value: #ff0000; }", []],
  ['6б CDO перед @font-face Bodoni', css0 + "\n<!-- @font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: url(x.woff2); }", []],
];
for (const [imya, css, kand] of SLUCHAI) {
  let out;
  try { out = await konvejer(css, kand); } catch (e) { console.log(`=== ${imya}\nконвейер бросил: ${String(e.message).split('\n')[0]}\n`); continue; }
  const vzyat = (re) => [...out.matchAll(re)].map((m) => m[0]);
  console.log(`=== ${imya}`);
  console.log('  --font-display*:', JSON.stringify(vzyat(/[^;{}]{0,40}--font-displ[^;}]*[;}]/g)));
  console.log('  @font-face Bodoni:', JSON.stringify(vzyat(/[^}]{0,8}@font-face\{[^}]*\}/g).filter((t) => /bodoni/i.test(t))));
  console.log('  @property --accent:', JSON.stringify(vzyat(/[^}]{0,12}@property --accent\{[^}]*\}/g)));
  console.log('');
}
