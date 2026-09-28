// GR3-klass: опыты в памяти. Входы — wejscie(), порча — в памяти, лист-временный — в своей папке.
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const Z = 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs';
const { sverka, wejscie, drzewoCss, deklaracje } = await import(Z);
const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const require = createRequire(join(SAYT, 'package.json'));
const viteReq = createRequire(require.resolve('@tailwindcss/vite'));
const twNode = await import(pathToFileURL(viteReq.resolve('@tailwindcss/node')).href);
const CSS_PUT = join(SAYT, 'src/styles/global.css');

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/gr3/gr3-klass/listy';
mkdirSync(PAPKA, { recursive: true });
const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
const TW = "@import 'tailwindcss' source('../../src');";
const zam = (s, iz, na) => { if (s.split(iz).length !== 2) throw new Error('порча не применилась: ' + iz); return s.replace(iz, () => na); };
const POSLE_YADRA = "@import '@factory/core/styles/a11y.css';";
const sListom = (w, imya, tekst) => { writeFileSync(join(PAPKA, imya), tekst); w.css = zam(w.css, POSLE_YADRA, `${POSLE_YADRA}\n@import '${join(PAPKA, imya).replace(/\\/g, '/')}';`); return w; };

async function vyvod(css) {
  const c = await twNode.compile(css, { base: dirname(CSS_PUT), from: CSS_PUT, shouldRewriteUrls: true, onDependency: () => {} });
  const istochniki = (c.root === 'none' ? [] : c.root === null ? [{ base: SAYT, pattern: '**/*', negated: false }] : [{ ...c.root, negated: false }]).concat(c.sources);
  const { Scanner } = await import(pathToFileURL(viteReq.resolve('@tailwindcss/oxide')).href);
  const kand = new Scanner({ sources: istochniki }).scan();
  return twNode.optimize(c.build(kand), { minify: false }).code;
}
// Где на странице стоят --font-display: цепочка прелюдий до объявления.
function gdeFd(code) {
  const out = [];
  const obhod = (uzly, put) => { for (const u of uzly) { if (u.oper) continue; const p = [...put, u.prelude]; for (const d of u.decls ?? []) if (d.imie === '--font-display') out.push(`${p.join(' > ')} :: ${d.wartosc}`); obhod(u.children ?? [], p); } };
  obhod(drzewoCss(code).uzly, []);
  return out;
}

const SLUCHAI = [
  ['kontrol: чистые входы', (w) => w],
  ['A1 tailwindcss с media print', (w) => { w.css = zam(w.css, TW, "@import 'tailwindcss' source('../../src') print;"); return w; }],
  ['A2 тема Tailwind отдельно, с media print', (w) => { w.css = zam(w.css, TW, "@layer theme, base, components, utilities;\n@import 'tailwindcss/theme.css' layer(theme) print;\n@import 'tailwindcss/preflight.css' layer(base);\n@import 'tailwindcss/utilities.css' layer(utilities) source('../../src');"); return w; }],
  ['A3 тема Tailwind отдельно, supports(display: nonsense)', (w) => { w.css = zam(w.css, TW, "@layer theme, base, components, utilities;\n@import 'tailwindcss/theme.css' layer(theme) supports(display: nonsense);\n@import 'tailwindcss/preflight.css' layer(base);\n@import 'tailwindcss/utilities.css' layer(utilities) source('../../src');"); return w; }],
  ['A4 тема Tailwind отдельно, (min-width: 100000px)', (w) => { w.css = zam(w.css, TW, "@layer theme, base, components, utilities;\n@import 'tailwindcss/theme.css' layer(theme) (min-width: 100000px);\n@import 'tailwindcss/preflight.css' layer(base);\n@import 'tailwindcss/utilities.css' layer(utilities) source('../../src');"); return w; }],
];
for (const [imya, mut] of SLUCHAI) {
  const w = mut(czyste());
  const { bledy } = await sverka(w);
  let gde;
  try { gde = gdeFd(await vyvod(w.css)); } catch (e) { gde = [`ОШИБКА ${e.message.split('\n')[0]}`]; }
  console.log(`=== ${imya}\nвердикт: ${bledy.length ? 'ОТКАЗ ' + bledy.length : 'СВЕРЕНО'}`);
  for (const b of bledy) console.log(`  - ${b.slice(0, 300)}`);
  console.log(`--font-display на странице:\n  ${gde.join('\n  ') || 'нет'}`);
}
