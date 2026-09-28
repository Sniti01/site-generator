// gr3-klass-prov: проверка GR3-K-1 и GR3-K-3 своим скриптом. Входы — wejscie(), порча — только в памяти.
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const { sverka, wejscie, drzewoCss, spisokGarniturChitaetsya } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs');
const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const req = createRequire(join(SAYT, 'package.json'));
const viteReq = createRequire(req.resolve('@tailwindcss/vite'));
const tw = await import(pathToFileURL(viteReq.resolve('@tailwindcss/node')).href);
const { Scanner } = await import(pathToFileURL(viteReq.resolve('@tailwindcss/oxide')).href);
const CSS = join(SAYT, 'src/styles/global.css');

const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const nowy = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
const zamena = (s, a, b) => { if (s.split(a).length !== 2) throw new Error('нет места порчи: ' + a); return s.replace(a, () => b); };

async function gde(css) {
  const c = await tw.compile(css, { base: dirname(CSS), from: CSS, shouldRewriteUrls: true, onDependency: () => {} });
  const ist = (c.root === 'none' ? [] : c.root === null ? [{ base: SAYT, pattern: '**/*', negated: false }] : [{ ...c.root, negated: false }]).concat(c.sources);
  const kod = tw.optimize(c.build(new Scanner({ sources: ist }).scan()), { minify: true }).code;
  const out = [];
  const obh = (uz, put) => { for (const u of uz) { if (u.oper) continue; const p = [...put, u.prelude]; for (const d of u.decls ?? []) if (d.imie === '--font-display') out.push(p.join(' > ')); obh(u.children ?? [], p); } };
  obh(drzewoCss(kod).uzly, []);
  return out;
}

const TW = "@import 'tailwindcss' source('../../src');";
const FD = "--font-display: 'Bodoni Moda', ui-serif, Georgia, 'Times New Roman', serif;";
const SLUCHAI = [
  ['K1 контроль', (w) => w],
  ['K1 целиком с print', (w) => { w.css = zamena(w.css, TW, "@import 'tailwindcss' source('../../src') print;"); }],
  ['K1 тема отдельно с print', (w) => { w.css = zamena(w.css, TW, "@layer theme, base, components, utilities;\n@import 'tailwindcss/theme.css' layer(theme) print;\n@import 'tailwindcss/preflight.css' layer(base);\n@import 'tailwindcss/utilities.css' layer(utilities) source('../../src');"); }],
  ['K1 (свой) целиком с supports(display: nonsense)', (w) => { w.css = zamena(w.css, TW, "@import 'tailwindcss' source('../../src') supports(display: nonsense);"); }],
  ['K1 (свой) целиком с not all', (w) => { w.css = zamena(w.css, TW, "@import 'tailwindcss' source('../../src') not all;"); }],
  ['K3 контроль serif', (w) => { w.css = zamena(w.css, FD, "--font-display: 'Bodoni Moda', serif;"); }],
  ['K3 serif Georgia', (w) => { w.css = zamena(w.css, FD, "--font-display: 'Bodoni Moda', serif Georgia;"); }],
  ['K3 (свой) cursive Moda, serif', (w) => { w.css = zamena(w.css, FD, "--font-display: 'Bodoni Moda', cursive Moda, serif;"); }],
  ['K3 (свой) SERIF Georgia (регистр)', (w) => { w.css = zamena(w.css, FD, "--font-display: 'Bodoni Moda', SERIF Georgia;"); }],
  ['K3 законное Georgia serif', (w) => { w.css = zamena(w.css, FD, "--font-display: 'Bodoni Moda', Georgia serif;"); }],
];
for (const [imya, f] of SLUCHAI) {
  const w = nowy();
  f(w);
  const { bledy } = await sverka(w);
  let g;
  try { g = (await gde(w.css)).join(' | '); } catch (e) { g = 'ошибка ' + e.message.split('\n')[0]; }
  console.log(`=== ${imya}\n  вердикт: ${bledy.length ? 'ОТКАЗ: ' + bledy.map((b) => b.slice(0, 140)).join(' || ') : 'СВЕРЕНО'}\n  --font-display на странице (minify): ${g || 'нет'}`);
}
for (const v of ["'Bodoni Moda', serif Georgia", "'Bodoni Moda', cursive Moda, serif", "'Bodoni Moda', Georgia serif"]) console.log(`spisokGarniturChitaetsya(${v}) = ${spisokGarniturChitaetsya(v)}`);
