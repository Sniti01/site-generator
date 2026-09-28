// Проверка находок GR3-Z-1, GR3-Z-2, GR3-Z-5 своими входами: sverka на настоящих входах с мутацией в памяти.
// Ничего не пишет в репозиторий; временные листы — в своей папке.
//   node prov1.mjs > prov1.txt
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const Z = await import(pathToFileURL(join(SAYT, 'tools/znak.mjs')).href);
const { sverka, wejscie, IMPORT_GARNITURY, spisokGarniturChitaetsya } = Z;
const P = import.meta.dirname;
const LISTY = join(P, 'listy');
mkdirSync(LISTY, { recursive: true });
const put = (p) => p.replace(/\\/g, '/');
const req = createRequire(join(SAYT, 'package.json'));
const viteReq = createRequire(req.resolve('@tailwindcss/vite'));
const twNode = await import(pathToFileURL(viteReq.resolve('@tailwindcss/node')).href);
const vite = await import(pathToFileURL(viteReq.resolve('vite')).href);

const baza = wejscie();
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: null });
const I = `@import '${IMPORT_GARNITURY}';`;
const POSLE_YADRA = "@import '@factory/core/styles/a11y.css';";
const zam = (s, iz, na) => { const n = s.split(iz).length - 1; if (n !== 1) throw new Error(`порча «${iz.slice(0, 40)}» — ${n} раз`); return s.replace(iz, () => na); };
let nomer = 0;
const list = (t) => { const f = join(LISTY, `p${++nomer}.css`); writeFileSync(f, t); return put(f); };
const sListom = (t) => (w) => { w.css = zam(w.css, POSLE_YADRA, `${POSLE_YADRA}\n@import '${list(t)}';`); return w; };
const fd = (v) => (w) => { w.css = w.css.replace(/--font-display:[^;]*;/, `--font-display: ${v};`); return w; };
const posleTemy = (f) => (w) => { w.css = zam(w.css, I, `${I}\n@import '@fontsource/bodoni-moda/${f}';`); return w; };
const i2 = (a, b) => (w) => b(a(w));

const out = [];
const progon = async (imya, mut) => {
  let bledy;
  try { ({ bledy } = await sverka(mut(czyste()))); } catch (e) { bledy = [`ИСКЛЮЧЕНИЕ ${e.message}`]; }
  out.push(`${imya}\n   ${bledy.length ? `ОТКАЗ (${bledy.length}):\n     - ${bledy.join('\n     - ')}` : 'СВЕРЕНО'}`);
};

out.push('== GR3-Z-1: var() в списке --font-display');
out.push(`spisokGarniturChitaetsya("'Bodoni Moda', var(--font-serif)") = ${spisokGarniturChitaetsya("'Bodoni Moda', var(--font-serif)")}`);
await progon('контроль: чистые входы', (w) => w);
await progon("Z1-a: 'Bodoni Moda', var(--font-serif)", fd("'Bodoni Moda', var(--font-serif)"));
await progon("Z1-b: 'Bodoni Moda', var(--font-sans)", fd("'Bodoni Moda', var(--font-sans)"));
await progon("Z1-c: 'Bodoni Moda', var(--net-takogo-tokena) (имя не объявлено — в браузере весь font-family недействителен)", fd("'Bodoni Moda', var(--net-takogo-tokena)"));
// Что выводит путь сборки при Z1-a: есть ли --font-serif на странице.
{
  const CSS_PUT = join(SAYT, 'src/styles/global.css');
  const css = fd("'Bodoni Moda', var(--font-serif)")(czyste()).css;
  const c = await twNode.compile(css, { base: dirname(CSS_PUT), from: CSS_PUT, shouldRewriteUrls: true, onDependency: () => {} });
  const kod = twNode.optimize(c.build([]), { minify: false }).code;
  out.push('   вывод пути сборки (build без кандидатов): ' + [...kod.matchAll(/--font-(display|serif)\s*:[^;]*;/g)].map((m) => m[0]).join(' || '));
}

out.push('\n== GR3-Z-2: разрешатель листов Vite против @tailwindcss/node');
await progon("Z2-a: @import '/src/styles/global.css' (корень Vite)", (w) => { w.css = zam(w.css, POSLE_YADRA, `${POSLE_YADRA}\n@import '/src/styles/global.css';`); return w; });
{
  const KOREN = join(P, 'mini-koren');
  mkdirSync(join(KOREN, 'src/styles'), { recursive: true });
  writeFileSync(join(KOREN, 'src/styles/dop.css'), '.dop { color: red; }\n');
  const cfg = await vite.resolveConfig({ root: KOREN, configFile: false, logLevel: 'silent' }, 'build');
  const r = cfg.createResolver({ ...cfg.resolve, extensions: ['.css'], mainFields: ['style'], conditions: ['style', 'production'], tryIndex: false, preferRelative: true });
  const base = join(KOREN, 'src/styles');
  for (const [imya, opc] of [['с customCssResolver Vite (как плагин)', { customCssResolver: async (id, b) => r(id, join(b, '__placeholder__.ts'), false, false) }], ['без него (как судья)', {}]]) {
    try {
      const k = await twNode.compile("@import '/src/styles/dop.css';\n", { base, from: join(base, 'global.css'), shouldRewriteUrls: true, onDependency: () => {}, ...opc });
      out.push(`   мини-корень, ${imya}: собрано — ${twNode.optimize(k.build([]), { minify: true }).code.trim()}`);
    } catch (e) { out.push(`   мини-корень, ${imya}: ОШИБКА ${String(e.message).split('\n')[0]}`); }
  }
}

out.push('\n== GR3-Z-5: ветви dlyaRoliTemy !m, diapazony нечитаемый и «?» — различимы ли строками отказа');
// Чужая грань поздно: без font-weight (вес не числом), с нечитаемым unicode-range, с «?». Перед ней — latin-ext-600 после темы (перехват).
const chuzhaya = (dop) => `@font-face { font-family: 'Bodoni Moda'; font-style: normal; src: url(chuzhaya.woff2);${dop} }\n`;
await progon('Z5-0 контроль: latin-ext-600 после темы (перехват)', posleTemy('latin-ext-600.css'));
await progon('Z5-a: latin-ext-600 после темы + поздняя чужая грань без font-weight', i2(posleTemy('latin-ext-600.css'), (w) => { w.css += '\n' + chuzhaya(''); return w; }));
await progon('Z5-b: то же, чужая грань font-weight: 600, unicode-range: U+0??', i2(posleTemy('latin-ext-600.css'), (w) => { w.css += '\n' + chuzhaya(' font-weight: 600; unicode-range: U+0??;'); return w; }));
await progon('Z5-c: то же, чужая грань font-weight: 600, unicode-range: U+1??-2FF (нечитаемый)', i2(posleTemy('latin-ext-600.css'), (w) => { w.css += '\n' + chuzhaya(' font-weight: 600; unicode-range: U+1??-2FF;'); return w; }));
await progon('Z5-d: только поздняя чужая грань без font-weight (без перехвата)', (w) => { w.css += '\n' + chuzhaya(''); return w; });
// Как путь сборки печатает такие дескрипторы.
{
  const CSS_PUT = join(SAYT, 'src/styles/global.css');
  const c = await twNode.compile(chuzhaya(' font-weight: bold; unicode-range: U+0??, U+1??-2FF;') + chuzhaya(' font-weight: normal;'), { base: dirname(CSS_PUT), from: CSS_PUT, shouldRewriteUrls: true, onDependency: () => {} });
  out.push('   путь сборки печатает: ' + twNode.optimize(c.build([]), { minify: false }).code.replace(/\s+/g, ' '));
}
// Грани пакета темы: веса и unicode-range.
{
  const papka = dirname(req.resolve(IMPORT_GARNITURY));
  const { readdirSync } = await import('node:fs');
  const vse = readdirSync(papka).filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(papka, f), 'utf8')).join('\n');
  const vesa = new Set([...vse.matchAll(/font-weight:\s*([^;]+);/g)].map((m) => m[1].trim()));
  const ur = [...vse.matchAll(/unicode-range:\s*([^;]+);/g)].map((m) => m[1]);
  out.push(`   пакет темы: веса ${[...vesa].join(', ')}; unicode-range с «?»: ${ur.filter((u) => u.includes('?')).length} из ${ur.length}; граней ${[...vse.matchAll(/@font-face/g)].length}; font-stretch: ${/font-stretch/.test(vse)}`);
}
console.log(out.join('\n'));
