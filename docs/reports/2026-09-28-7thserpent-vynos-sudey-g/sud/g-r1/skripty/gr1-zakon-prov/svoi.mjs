// Свой член класса: законные формы импорта Tailwind и опции, которых скептик не пробовал.
// Судья (sverka) против сборки «как у плагина Vite» и против самого текста страницы: какое имя переменной
// выходит, что стоит в .t-headline и есть ли `--font-display` объявлением (без комментариев).
//   node svoi.mjs
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
const bezKomm = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

async function kakVite(css) {
  try {
    const c = await twNode.compile(css, { base: dirname(CSS_PUT), from: CSS_PUT, onDependency: () => {} });
    const sources = (c.root === 'none' ? [] : c.root === null ? [{ base: dirname(CSS_PUT), pattern: '**/*', negated: false }] : [{ ...c.root, negated: false }]).concat(c.sources);
    const kand = new Scanner({ sources }).scan();
    const out = bezKomm(c.build(kand));
    const tochno = [...out.matchAll(/(?<![-\w])--font-display\s*:\s*([^;}]*)[;}]/g)].map((m) => m[1].trim());
    const vse = [...out.matchAll(/(--[-\w]*font-display)\s*:\s*([^;}]*)[;}]/g)].map((m) => `${m[1]}: ${m[2].trim()}`);
    const headline = /\.t-headline\s*\{[^}]*\}/.exec(out)?.[0].replace(/\s+/g, ' ').slice(0, 60) ?? 'нет';
    return `объявления «--font-display» ровно этим именем: ${tochno.join(' | ') || 'НЕТ'}; все *font-display: ${vse.join(' | ') || 'нет'}; ${headline}`;
  } catch (e) {
    return `падает: ${String(e.message).split('\n')[0]}`;
  }
}

const TW = "@import 'tailwindcss' source('../../src');";
const zam = (iz, na) => (css) => { if (!css.includes(iz)) throw new Error(`нет «${iz}»`); return css.replace(iz, na); };
const SLUCHAI = [
  ['prefix(tw)', zam(TW, "@import 'tailwindcss' source('../../src') prefix(tw);")],
  ['important', zam(TW, "@import 'tailwindcss' source('../../src') important;")],
  ['theme(static)', zam(TW, "@import 'tailwindcss' source('../../src') theme(static);")],
  ['source(none) и @source', zam(TW, "@import 'tailwindcss' source(none);\n@source '../../src';")],
  ['@utility с var(--font-display)', (css) => `${css}\n@utility font-znak { font-family: var(--font-display); }`],
  ['@custom-variant', (css) => `${css}\n@custom-variant noc (&:where(.noc, .noc *));`],
  ['подключ --font-display--font-feature-settings', zam("\n  --font-text:", "\n  --font-display--font-feature-settings: 'lnum';\n  --font-text:")],
  ['--font-display без пробелов', (css) => css.replace(/--font-display:[^;]*;/, "--font-display:'Bodoni Moda',serif;")],
];
const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const out = [];
for (const [imya, mut] of SLUCHAI) {
  let css;
  try { css = mut(baza.css); } catch (e) { out.push(`== ${imya}\n   ПРАВКА НЕ ПРИМЕНИЛАСЬ: ${e.message}`); continue; }
  const { bledy } = await sverka({ ...baza, css, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
  out.push(`== ${imya}\n   судья: ${bledy.length ? `ОТКАЗ (${bledy.length}): ${bledy.join(' || ')}` : 'сверено'}\n   как Vite: ${await kakVite(css)}`);
}
writeFileSync(join(TUT, 'svoi.txt'), out.join('\n') + '\n');
console.log(out.join('\n'));
