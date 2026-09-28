// Проверка находок GR1-Z-1…5, -11 своим скриптом: вердикт sverka (судья знака) на правке листа в памяти
// против сборки Tailwind «как у плагина Vite» (@tailwindcss/node compile — резолвер и loadModule пакета,
// кандидаты — сканер oxide по root/sources компилятора). В репозитории ничего не пишет.
//   node povtor.mjs
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const TUT = import.meta.dirname;
const req = createRequire(join(SAYT, 'package.json'));
const { sverka, wejscie } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs');
const twNode = await import(pathToFileURL(req.resolve('@tailwindcss/node')).href);
const { Scanner } = req('@tailwindcss/oxide');
const CSS_PUT = join(SAYT, 'src/styles/global.css');

const fdIz = (out) => [...out.matchAll(/(?<![-\w])--font-display\s*:\s*([^;}]*)[;}]/g)].map((m) => m[1].trim());
async function kakVite(css) {
  try {
    const c = await twNode.compile(css, { base: dirname(CSS_PUT), from: CSS_PUT, onDependency: () => {} });
    const sources = (c.root === 'none' ? [] : c.root === null ? [{ base: dirname(CSS_PUT), pattern: '**/*', negated: false }] : [{ ...c.root, negated: false }]).concat(c.sources);
    const kand = new Scanner({ sources }).scan();
    const out = c.build(kand);
    const headline = /\.t-headline\s*\{[^}]*\}/.exec(out)?.[0].replace(/\s+/g, ' ') ?? 'нет';
    const imena = [...new Set([...out.matchAll(/(--[-\w]*font-display)\s*:/g)].map((m) => m[1]))];
    return { fd: fdIz(out), kand: kand.length, headline, imena, pustoiBuild: fdIz(c.build([])) };
  } catch (e) {
    return { oshibka: String(e.message).split('\n')[0] };
  }
}
const bodoni = (v) => v.length > 0 && v.every((x) => /^(['"])Bodoni Moda\1\s*(,|$)/.test(x));

writeFileSync(join(TUT, 'zaglushka-plagin.mjs'), 'export default function () {}\n');
writeFileSync(join(TUT, 'zaglushka-konfig.mjs'), 'export default {}\n');
const PLAGIN = join(TUT, 'zaglushka-plagin.mjs').replace(/\\/g, '/');
const KONFIG = join(TUT, 'zaglushka-konfig.mjs').replace(/\\/g, '/');
const TW = "@import 'tailwindcss' source('../../src');";
const zam = (iz, na) => (css) => { if (!css.includes(iz)) throw new Error(`нет «${iz}»`); return css.replace(iz, na); };

const SLUCHAI = [
  ['контроль: чистый лист', (css) => css],
  ['Z-1: tailwindcss по частям, подпути без .css', zam(TW, "@layer theme, base, components, utilities;\n@import 'tailwindcss/theme' layer(theme);\n@import 'tailwindcss/preflight' layer(base);\n@import 'tailwindcss/utilities' layer(utilities) source('../../src');")],
  ['Z-1 контроль: подпути с .css', zam(TW, "@layer theme, base, components, utilities;\n@import 'tailwindcss/theme.css' layer(theme);\n@import 'tailwindcss/preflight.css' layer(base);\n@import 'tailwindcss/utilities.css' layer(utilities) source('../../src');")],
  ['Z-1 доп.: @import "tailwindcss/index" (вывод ./index)', zam(TW, "@import 'tailwindcss/index' source('../../src');")],
  ['Z-2: @plugin заглушки', zam("@source not '../content';", `@source not '../content';\n@plugin '${PLAGIN}';`)],
  ['Z-2 доп.: @config заглушки', zam("@source not '../content';", `@source not '../content';\n@config '${KONFIG}';`)],
  ['Z-3: из .t-headline убран font-family: var(--font-display)', zam('.t-headline {\n  font-family: var(--font-display);\n', '.t-headline {\n')],
  ['Z-4: поздний @theme — сброс --font-* и новое --font-display', (css) => `${css}\n@theme { --font-*: initial; --font-display: 'Bodoni Moda', serif; --font-text: 'Public Sans', sans-serif; }`],
  ['Z-5: лицензионный комментарий /*! … */', zam('\n@theme {', "\n/*! прежде: --font-display: 'Libre Bodoni'; */\n@theme {")],
  ['Z-5 контроль: обычный комментарий', zam('\n@theme {', "\n/* прежде: --font-display: 'Libre Bodoni'; */\n@theme {")],
  ['Z-11: своя @font-face Бодони и поздний сброс --f-*', (css) => `${css}\n@font-face { font-family: 'Bodoni Moda'; src: url(x.woff2); }\n@theme { --f-*: initial; }`],
  ['Z-11 доп.: только своя @font-face Бодони (без сброса)', (css) => `${css}\n@font-face { font-family: 'Bodoni Moda'; src: url(x.woff2); }`],
];

const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const out = [];
for (const [imya, mut] of SLUCHAI) {
  let css;
  try { css = mut(baza.css); } catch (e) { out.push(`== ${imya}\n   ПРАВКА НЕ ПРИМЕНИЛАСЬ: ${e.message}`); continue; }
  const { bledy } = await sverka({ ...baza, css, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
  const n = await kakVite(css);
  const sb = n.oshibka
    ? `падает: ${n.oshibka}`
    : `--font-display: ${n.fd.join(' | ') || 'нет'} → ${bodoni(n.fd) ? 'Бодони первым' : 'Бодони НЕТ'}; кандидатов ${n.kand}; build([]) дал бы: ${n.pustoiBuild.join(' | ') || 'нет'}; имена: ${n.imena.join(', ')}; ${n.headline}`;
  out.push(`== ${imya}\n   судья: ${bledy.length ? `ОТКАЗ (${bledy.length}): ${bledy.join(' || ')}` : 'сверено'}\n   как Vite: ${sb}`);
}
writeFileSync(join(TUT, 'povtor.txt'), out.join('\n') + '\n');
console.log(out.join('\n'));
