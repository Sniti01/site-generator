// Свой член класса «поиск объявлений регулярным выражением по тексту вывода Tailwind» (сосед GR1-Z-5):
// законное custom property, имя которого кончается на «font-display», и строка с текстом «--font-display:».
// Судья (sverka) против текста страницы «как у плагина Vite», где объявления ищутся по точному имени
// (слева не буква, не цифра, не «-») и без комментариев.
//   node svoi2.mjs
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

async function kakVite(css) {
  const c = await twNode.compile(css, { base: dirname(CSS_PUT), from: CSS_PUT, onDependency: () => {} });
  const sources = (c.root === 'none' ? [] : c.root === null ? [{ base: dirname(CSS_PUT), pattern: '**/*', negated: false }] : [{ ...c.root, negated: false }]).concat(c.sources);
  const out = c.build(new Scanner({ sources }).scan());
  const bez = out.replace(/\/\*[\s\S]*?\*\//g, '');
  const tochno = [...bez.matchAll(/(?<![-\w])--font-display\s*:\s*([^;}]*)[;}]/g)].map((m) => m[1].trim());
  const kakSudya = [...out.matchAll(/--font-display\s*:\s*([^;}]*)[;}]/g)].map((m) => m[1].trim());
  const kuski = [...out.matchAll(/[^\n]*(hero-font-display|content: "--font-display)[^\n]*/g)].map((m) => m[0].trim());
  return `точным именем: ${tochno.join(' | ') || 'НЕТ'}; регулярным выражением судьи: ${kakSudya.join(' | ')}; строки вывода: ${kuski.join(' ¦ ') || '—'}`;
}
const SLUCHAI = [
  ['своё --hero-font-display в :root', (css) => css.replace('\n  --ease-out:', "\n  --hero-font-display: 'Libre Bodoni', serif;\n  --ease-out:")],
  ['своё --hero-font-display в правиле', (css) => `${css}\n.hero { --hero-font-display: 'Libre Bodoni', serif; font-family: var(--hero-font-display); }`],
  ['строка с текстом «--font-display:»', (css) => `${css}\n.otladka::after { content: "--font-display: serif;"; }`],
];
const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const out = [];
for (const [imya, mut] of SLUCHAI) {
  const css = mut(baza.css);
  const { bledy } = await sverka({ ...baza, css, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
  out.push(`== ${imya}${css === baza.css ? ' [ПРАВКА НЕ ПРИМЕНИЛАСЬ]' : ''}\n   судья: ${bledy.length ? `ОТКАЗ (${bledy.length}): ${bledy.join(' || ')}` : 'сверено'}\n   как Vite: ${await kakVite(css)}`);
}
writeFileSync(join(TUT, 'svoi2.txt'), out.join('\n') + '\n');
console.log(out.join('\n'));
