// Контекст объявления --font-display: Georgia на странице (слой или нет) для K3а, M2, M3, K1б; и K4 — порядок @font-face.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const TUT = dirname(fileURLToPath(import.meta.url));
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
const css0 = readFileSync(CSS_PUT, 'utf8');
const BASE_IMPORT = "@import '@factory/core/styles/base.css';";
const s = (imya) => css0.replace(BASE_IMPORT, `${BASE_IMPORT}\n@import '${join(TUT, 'listy', imya + '.css').replace(/\\/g, '/')}';`);
// Уровень вложенности и открытые блоки на месте смещения.
function kontekst(t, idx) {
  const stek = [];
  let buf = '';
  for (let i = 0; i < idx; i++) {
    const c = t[i];
    if (c === '"' || c === "'") { const j = t.indexOf(c, i + 1); buf += t.slice(i, j + 1); i = j; continue; }
    if (c === '{') { stek.push(buf.trim().slice(-60)); buf = ''; continue; }
    if (c === '}') { stek.pop(); buf = ''; continue; }
    if (c === ';') { buf = ''; continue; }
    buf += c;
  }
  return stek;
}
for (const [imya, css, kand] of [['K3а ekran61', s('ekran61'), []], ['M2 ekran2d', s('ekran2d'), []], ['M3 ekran69', s('ekran69'), []], ['K1б utility', s('utility'), ['zag-x']], ['K1а kandidat', css0, ['[--font-display:Georgia]']], ['K4 fontface', s('fontface'), []]]) {
  const c = await twCompile(css, { base: dirname(CSS_PUT), from: CSS_PUT, loadStylesheet: async (id, base) => { const f = nayti(id, base); return { path: f, base: dirname(f), content: readFileSync(f, 'utf8') }; }, onDependency: () => {} });
  const t = (await esbuild.transform(twNode.optimize(c.build(kand), { minify: true }).code, { loader: 'css', minify: true })).code;
  console.log(`=== ${imya}`);
  for (const m of t.matchAll(/--font-display:([^;}]*)/g)) console.log(`  --font-display:${m[1]}  @${m.index}  блоки: ${JSON.stringify(kontekst(t, m.index))}`);
  for (const m of t.matchAll(/@font-face\{font-family:Bodoni Moda;[^}]*\}/g)) console.log(`  @font-face @${m.index}: ${m[0].slice(0, 100)}  блоки: ${JSON.stringify(kontekst(t, m.index))}`);
}
