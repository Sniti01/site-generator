// GR3-klass: прочие члены класса — в памяти.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const Z = 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs';
const { sverka, wejscie, drzewoCss } = await import(Z);
const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const require = createRequire(join(SAYT, 'package.json'));
const viteReq = createRequire(require.resolve('@tailwindcss/vite'));
const twNode = await import(pathToFileURL(viteReq.resolve('@tailwindcss/node')).href);
const { Scanner } = await import(pathToFileURL(viteReq.resolve('@tailwindcss/oxide')).href);
const CSS_PUT = join(SAYT, 'src/styles/global.css');
const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/65dd1ec1-d282-489e-807d-18603cf0e02f/scratchpad/gr3/gr3-klass/listy';
mkdirSync(PAPKA, { recursive: true });
const P = (f) => join(PAPKA, f).replace(/\\/g, '/');
const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
const TW = "@import 'tailwindcss' source('../../src');";
const zam = (s, iz, na) => { if (s.split(iz).length !== 2) throw new Error('порча не применилась: ' + iz); return s.replace(iz, () => na); };
const POSLE_YADRA = "@import '@factory/core/styles/a11y.css';";
const sListom = (w, imya, tekst) => { writeFileSync(join(PAPKA, imya), tekst); w.css = zam(w.css, POSLE_YADRA, `${POSLE_YADRA}\n@import '${P(imya)}';`); return w; };
const YAD = ['[', '--font-', 'display:Georgia', ']'].join('');

async function vyvod(css, minify = false) {
  const c = await twNode.compile(css, { base: dirname(CSS_PUT), from: CSS_PUT, shouldRewriteUrls: true, onDependency: () => {} });
  const ist = (c.root === 'none' ? [] : c.root === null ? [{ base: SAYT, pattern: '**/*', negated: false }] : [{ ...c.root, negated: false }]).concat(c.sources);
  return twNode.optimize(c.build(c.features & twNode.Features.Utilities ? new Scanner({ sources: ist }).scan() : []), { minify }).code;
}
function gde(code, test) {
  const out = [];
  const obhod = (uzly, put) => { for (const u of uzly) { if (u.oper) continue; const p = [...put, u.prelude]; for (const d of u.decls ?? []) if (test(d, u)) out.push(`${p.join(' > ')} :: ${d.imie}: ${d.wartosc}`); obhod(u.children ?? [], p); } };
  const t = drzewoCss(code);
  obhod(t.uzly, []);
  return t.bledy.length ? [`НЕ ЧИТАЕТСЯ: ${t.bledy[0]}`, ...out] : out;
}
const fdTest = (d) => d.imie === '--font-display';
const ffTest = (d, u) => /font-face/i.test(u.prelude) && /^(font-family|src)$/i.test(d.imie);

writeFileSync(join(PAPKA, 'tw.config.mjs'), "export default { theme: { extend: { fontFamily: { display: ['Georgia', 'serif'] } } } };\n");
const SLUCHAI = [
  ['B1 своя грань font-family с !important в импортированном листе', (w) => sListom(w, 'imp.css', "@font-face { font-family: 'Bodoni Moda' !important; font-style: normal; font-weight: 600; src: local('Georgia'); }\n"), ffTest],
  ['B2 @source inline() с ядом', (w) => { w.css = zam(w.css, TW, `${TW}\n@source inline("${YAD}");`); return w; }, fdTest],
  ['B3 @theme inline у сайта', (w) => { w.css = zam(w.css, '\n@theme {', '\n@theme inline {'); return w; }, fdTest],
  ['B4 prefix(tw) у tailwindcss', (w) => { w.css = zam(w.css, TW, "@import 'tailwindcss' source('../../src') prefix(tw);"); return w; }, fdTest],
  ['B5 @config с fontFamily.display = Georgia', (w) => { w.css = zam(w.css, TW, `${TW}\n@config '${P('tw.config.mjs')}';`); return w; }, fdTest],
  ['A2m тема Tailwind в media print (minify как в сборке)', (w) => { w.css = zam(w.css, TW, "@layer theme, base, components, utilities;\n@import 'tailwindcss/theme.css' layer(theme) print;\n@import 'tailwindcss/preflight.css' layer(base);\n@import 'tailwindcss/utilities.css' layer(utilities) source('../../src');"); return w; }, fdTest, true],
];
for (const [imya, mut, test, minify] of SLUCHAI) {
  const w = mut(czyste());
  const { bledy } = await sverka(w);
  let g;
  try { g = gde(await vyvod(w.css, !!minify), test); } catch (e) { g = [`ОШИБКА ${e.message.split('\n')[0]}`]; }
  console.log(`=== ${imya}\nвердикт: ${bledy.length ? 'ОТКАЗ ' + bledy.length : 'СВЕРЕНО'}`);
  for (const b of bledy) console.log(`  - ${b.slice(0, 260)}`);
  console.log(`на странице:\n  ${g.slice(0, 12).join('\n  ') || 'нет'}`);
}
