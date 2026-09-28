// Вердикт судьи (sverka) на наборе входов — под крюком мутации или без него. Ничего не пишет в репозиторий.
//   node --import ./kryuk.mjs posledstvie.mjs
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';

const { sverka, wejscie } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs');
const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const TUT = import.meta.dirname;
writeFileSync(join(TUT, 'zaglushka-plagin.mjs'), 'export default function () {}\n');
const PLAGIN = join(TUT, 'zaglushka-plagin.mjs').replace(/\\/g, '/');
const spisok = (v) => (css) => css.replace(/--font-display:[^;]*;/, `--font-display: ${v};`);
const SLUCHAI = [
  ['M1: своя @font-face, продолжение строки внутри слова', (css) => `${css}\n@font-face { font-family: 'Bodoni Mo\\\nda'; src: url(x.woff2); }`],
  ['M2: своя @font-face «Bodoni\\0 Moda» (U+FFFD — другая гарнитура)', (css) => `${css}\n@font-face { font-family: 'Bodoni\\0 Moda'; src: url(x.woff2); }`],
  ['M3: @plugin (compile() бросает)', (css) => css.replace("@source not '../content';", `@source not '../content';\n@plugin '${PLAGIN}';`)],
  ['M3: @import несуществующего листа', (css) => `${css}\n@import './net-takogo.css';`],
  ['M4: список с inherit', spisok("'Bodoni Moda', inherit")],
  ['M4: список с default', spisok("'Bodoni Moda', default")],
  ['M4: список с revert-layer', spisok("'Bodoni Moda', revert-layer")],
  ['M5: tailwindcss/theme.css по частям', (css) => css.replace("@import 'tailwindcss' source('../../src');", "@layer theme, base, components, utilities;\n@import 'tailwindcss/theme.css' layer(theme);\n@import 'tailwindcss/preflight.css' layer(base);\n@import 'tailwindcss/utilities.css' layer(utilities) source('../../src');")],
  ['M6: список с Noto\\ Serif', spisok("'Bodoni Moda', Noto\\ Serif, serif")],
  ['M7: список со строкой с экранированной кавычкой', spisok("'Bodoni Moda', 'Times\\' New', serif")],
];
const out = [];
for (const [imya, mut] of SLUCHAI) {
  const css = mut(baza.css);
  const { bledy } = await sverka({ ...baza, css, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
  out.push(`   ${imya}${css === baza.css ? ' [ПРАВКА НЕ ПРИМЕНИЛАСЬ]' : ''}: ${bledy.length ? `ОТКАЗ — ${bledy.map((b) => b.slice(0, 110)).join(' || ')}` : 'сверено'}`);
}
console.log(out.join('\n'));
