// GR1-Z: build([]) против build(кандидаты сканера) — свежий compile на каждый вызов (build в Tailwind накопительный).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const req = createRequire(join(SAYT, 'package.json'));
const twNode = await import(pathToFileURL(req.resolve('@tailwindcss/node')).href);
const { Scanner } = req('@tailwindcss/oxide');
const CSS_PUT = join(SAYT, 'src/styles/global.css');
const css = readFileSync(CSS_PUT, 'utf8').replace('.t-headline {\n  font-family: var(--font-display);\n', '.t-headline {\n');
const fd = (o) => [...o.matchAll(/--font-display\s*:\s*([^;}]*)[;}]/g)].map((m) => m[1].trim()).join(' | ') || 'нет';
const svezhii = () => twNode.compile(css, { base: dirname(CSS_PUT), from: CSS_PUT, onDependency: () => {} });
const c1 = await svezhii();
const sources = [{ ...c1.root, negated: false }, ...c1.sources];
const kand = new Scanner({ sources }).scan();
const out = [
  `правка применилась: ${css !== readFileSync(CSS_PUT, 'utf8')}`,
  `build([]) (как судья): ${fd(c1.build([]))}`,
  `build(кандидаты сканера, ${kand.length}; есть «--font-display»: ${kand.includes('--font-display')}) (как плагин Vite): ${fd((await svezhii()).build(kand))}`,
  `build(['--font-display']): ${fd((await svezhii()).build(['--font-display']))}`,
  `файлы-источники с «--font-display»: ${new Scanner({ sources }).files.filter((f) => readFileSync(f, 'utf8').includes('--font-display')).map((f) => f.replace(/\\/g, '/').replace(/^.*site-generator\//, '')).join(', ')}`,
];
writeFileSync(join(import.meta.dirname, 'kandidaty.txt'), out.join('\n') + '\n');
console.log(out.join('\n'));
