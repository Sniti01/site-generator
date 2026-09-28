// GR1-Z: (а) гарнитура заголовков — не из global.css, а из компонентов (var(--font-display) — в core/*.astro, которые
// сканирует Tailwind); (б) «лист, который модель уже отвергла, Tailwind не судит» — отказ модели другого вида.
//   node zakonnye2.mjs
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
  const c = await twNode.compile(css, { base: dirname(CSS_PUT), from: CSS_PUT, onDependency: () => {} });
  const sources = (c.root === 'none' ? [] : c.root === null ? [{ base: dirname(CSS_PUT), pattern: '**/*', negated: false }] : [{ ...c.root, negated: false }]).concat(c.sources);
  const kand = new Scanner({ sources }).scan();
  const fd = (o) => [...o.matchAll(/--font-display\s*:\s*([^;}]*)[;}]/g)].map((m) => m[1].trim());
  return { sKand: fd(c.build(kand)), bezKand: fd(c.build([])), estKand: kand.includes('--font-display') };
}
const SLUCHAI = [
  ['(а) .t-headline без font-family: var(--font-display) (гарнитуру берут компоненты ядра)', (css) => css.replace('.t-headline {\n  font-family: var(--font-display);\n', '.t-headline {\n')],
  ['(б) своя @font-face Бодони и поздний сброс --f-*', (css) => `${css}\n@font-face { font-family: 'Bodoni Moda'; src: url(x.woff2); }\n@theme { --f-*: initial; }`],
  ['(б) краска не #rrggbb и поздний сброс --f-*', (css) => `${css}\n:root { --accent: rgb(1 2 3); }\n@theme { --f-*: initial; }`],
];
const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const out = [];
for (const [imya, mut] of SLUCHAI) {
  const css = mut(baza.css);
  const { bledy } = await sverka({ ...baza, css, znak: structuredClone(baza.znak), publiczne: css.includes('rgb(1 2 3)') ? null : new Map(pliki) });
  const n = await nastoyashchaya(css);
  out.push(`== ${imya}${css === baza.css ? ' [ПРАВКА НЕ ПРИМЕНИЛАСЬ]' : ''}\n   судья: ${bledy.length ? `ОТКАЗ (${bledy.length}):\n     - ${bledy.join('\n     - ')}` : 'сверено'}\n   сборка с кандидатами сканера: ${n.sKand.join(' | ') || 'нет'}; build([]): ${n.bezKand.join(' | ') || 'нет'}; кандидат --font-display: ${n.estKand}`);
}
writeFileSync(join(import.meta.dirname, 'zakonnye2.txt'), out.join('\n') + '\n');
console.log(out.join('\n'));
