// GR1-Z: законные правки global.css (в памяти) — вердикт судьи знака (sverka) против «настоящей» сборки Tailwind:
// @tailwindcss/node compile (резолвер пакета, loadModule — как у плагина Vite) + сканер oxide по source()/@source листа
// (кандидаты — как у плагина Vite) → build(кандидаты). Ничего в репозитории не пишет.
//   node zakonnye.mjs
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const req = createRequire(join(SAYT, 'package.json'));
const { sverka, wejscie } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs');
const twNode = await import(pathToFileURL(req.resolve('@tailwindcss/node')).href);
const { Scanner } = req('@tailwindcss/oxide');
const CSS_PUT = join(SAYT, 'src/styles/global.css');

async function nastoyashchaya(css) {
  try {
    const c = await twNode.compile(css, { base: dirname(CSS_PUT), from: CSS_PUT, onDependency: () => {} });
    const sources = (c.root === 'none' ? [] : c.root === null ? [{ base: dirname(CSS_PUT), pattern: '**/*', negated: false }] : [{ ...c.root, negated: false }]).concat(c.sources);
    const kand = new Scanner({ sources }).scan();
    const out = c.build(kand);
    return { fd: [...out.matchAll(/--font-display\s*:\s*([^;}]*)[;}]/g)].map((m) => m[1].trim()), kand: kand.length };
  } catch (e) {
    return { oshibka: String(e.message).split('\n')[0] };
  }
}
const bodoni = (v) => v.length > 0 && v.every((x) => /^(['"])Bodoni Moda\1\s*(,|$)/.test(x));

const PLAGIN = pathToFileURL(join(import.meta.dirname, 'plagin.mjs')).href.replace('file:///', '');
writeFileSync(join(import.meta.dirname, 'plagin.mjs'), 'export default function () {}\n');

const SLUCHAI = [
  ['контроль: чистый лист', (css) => css],
  ['tailwindcss по частям, подпути без .css (выводы пакета: ./theme, ./preflight, ./utilities)', (css) => css.replace("@import 'tailwindcss' source('../../src');", "@layer theme, base, components, utilities;\n@import 'tailwindcss/theme' layer(theme);\n@import 'tailwindcss/preflight' layer(base);\n@import 'tailwindcss/utilities' layer(utilities) source('../../src');")],
  ['tailwindcss по частям, подпути с .css (как в документации)', (css) => css.replace("@import 'tailwindcss' source('../../src');", "@layer theme, base, components, utilities;\n@import 'tailwindcss/theme.css' layer(theme);\n@import 'tailwindcss/preflight.css' layer(base);\n@import 'tailwindcss/utilities.css' layer(utilities) source('../../src');")],
  ['@plugin (любой модуль-плагин)', (css) => css.replace("@source not '../content';", `@source not '../content';\n@plugin '${PLAGIN}';`)],
  ['.t-headline: font-family через --theme(--font-display)', (css) => css.replace('.t-headline {\n  font-family: var(--font-display);', '.t-headline {\n  font-family: --theme(--font-display);')],
  ['.t-headline: @apply font-display', (css) => css.replace('.t-headline {\n  font-family: var(--font-display);', '.t-headline {\n  @apply font-display;')],
  ['лицензионный комментарий /*! с именем токена */', (css) => css.replace('@theme {', "/*! прежде: --font-display: 'Libre Bodoni'; */\n@theme {")],
  ['обычный комментарий с именем токена', (css) => css.replace('@theme {', "/* прежде: --font-display: 'Libre Bodoni'; */\n@theme {")],
  ['поздний @theme: сброс --font-* и новое объявление --font-display (Бодони первым)', (css) => `${css}\n@theme { --font-*: initial; --font-display: 'Bodoni Moda', serif; --font-text: 'Public Sans', sans-serif; }`],
];

const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const out = [];
for (const [imya, mut] of SLUCHAI) {
  const css = mut(baza.css);
  const primenilas = imya.startsWith('контроль') || css !== baza.css;
  const { bledy } = await sverka({ ...baza, css, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
  const n = await nastoyashchaya(css);
  const naStr = n.oshibka ? `Tailwind (как Vite) падает: ${n.oshibka}` : `на странице --font-display: ${n.fd.join(' | ') || 'нет'} → ${bodoni(n.fd) ? 'Бодони первым' : 'Бодони НЕТ'} (кандидатов ${n.kand})`;
  out.push(`== ${imya}${primenilas ? '' : ' [ПРАВКА НЕ ПРИМЕНИЛАСЬ]'}\n   судья: ${bledy.length ? `ОТКАЗ (${bledy.length}): ${bledy.join(' || ')}` : 'сверено'}\n   сборка: ${naStr}`);
}
writeFileSync(join(import.meta.dirname, 'zakonnye.txt'), out.join('\n') + '\n');
console.log(out.join('\n'));
