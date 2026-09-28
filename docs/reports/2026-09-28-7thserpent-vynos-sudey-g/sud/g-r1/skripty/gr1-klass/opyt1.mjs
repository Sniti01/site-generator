// Опыты скептика gr1-klass: мутации входов в памяти, вызов sverka; импортированный лист — копия в своей папке.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const TUT = dirname(fileURLToPath(import.meta.url));
const { sverka, wejscie } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs');
const req = createRequire(join(SAYT, 'package.json'));
const tw = await import(pathToFileURL(req.resolve('tailwindcss')).href);
const twCompile = tw.compile ?? tw.default?.compile;
const TWP = dirname(req.resolve('tailwindcss/package.json'));
const CSS_PUT = join(SAYT, 'src/styles/global.css');
const nayti = (id, base) => {
  if (id.startsWith('.') || id.startsWith('/')) return resolve(base, id);
  if (id === 'tailwindcss') return join(TWP, 'index.css');
  if (id.startsWith('tailwindcss/')) return join(TWP, id.slice('tailwindcss/'.length));
  return createRequire(join(base, 'x.js')).resolve(id);
};
async function strana(css, kand = []) {
  const c = await twCompile(css, {
    base: dirname(CSS_PUT), from: CSS_PUT,
    loadStylesheet: async (id, base) => { const f = nayti(id, base); return { path: f, base: dirname(f), content: readFileSync(f, 'utf8') }; },
    onDependency: () => {},
  });
  return c.build(kand);
}
const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });

const BASE_IMPORT = "@import '@factory/core/styles/base.css';";
const basePut = req.resolve('@factory/core/styles/base.css');
const baseCss = readFileSync(basePut, 'utf8');
// Порча листа ядра: копия base.css с добавкой — в своей папке; global.css импортирует копию вместо base.css.
const vImporte = (imya, dobavka) => (w) => {
  const f = join(TUT, `base-${imya}.css`).replace(/\\/g, '/');
  writeFileSync(f, baseCss + '\n' + dobavka + '\n');
  if (!w.css.includes(BASE_IMPORT)) throw new Error('нет импорта base.css');
  w.css = w.css.split(BASE_IMPORT).join(`@import '${f}';`);
  return w;
};
const dop = (txt) => (w) => { w.css += '\n' + txt; return w; };

const SLUCHAI = [
  ['0 контроль', (w) => w, []],
  ['0б контроль: base.css через копию без добавки', vImporte('kontrol', ''), []],
  ['1 произвольное свойство-кандидат [--font-display:Georgia] в разметке', (w) => w, ['[--font-display:Georgia]']],
  ['2 лист ядра: список --font-display, который CSS не читает (R5-SVERKA-5)', vImporte('spisok', ":root { --font-display: 'Bodoni Moda',, serif; }"), []],
  ['2б лист ядра: @theme со списком, который CSS не читает', vImporte('spisok-theme', "@theme { --font-display: 'Bodoni Moda', 10px; }"), []],
  ['3 лист ядра: своя @font-face Bodoni Moda 600', vImporte('fontface', "@font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: url(x.woff2); }"), []],
  ['4 лист ядра: --font-displ\\61y (экранирование в имени)', vImporte('ekran', ":root { --font-displ\\61y: Georgia, serif; }"), []],
  ['5 global.css: своя @font-face, имя разорвано комментарием Bodoni/**/Moda', dop('@font-face { font-family: Bodoni/**/Moda; font-weight: 600; src: url(x.woff2); }'), []],
  ['6 global.css: CDO перед @property --accent', dop("<!-- @property --accent { syntax: '<color>'; inherits: false; initial-value: #ff0000; }"), []],
  ['6б global.css: CDO перед @font-face Bodoni', dop("<!-- @font-face { font-family: 'Bodoni Moda'; font-weight: 600; src: url(x.woff2); }"), []],
  ['7 global.css: .t-headline с другой гарнитурой', dop('.t-headline { font-family: Georgia, serif; }'), []],
  ['8 global.css: @apply произвольного свойства в html', dop('html { @apply [--font-display:Georgia]; }'), []],
  ['9 лист ядра: @utility с --font-display и кандидат', vImporte('utility', '@utility zagolovok-x { --font-display: Georgia; }'), ['zagolovok-x']],
];
for (const [imya, mut, kand] of SLUCHAI) {
  const w = mut(czyste());
  const { bledy } = await sverka(w);
  let vyvod;
  try {
    const out = await strana(w.css, kand);
    const fd = [...out.matchAll(/--font-displ[^:;{}]*:\s*([^;}]*)[;}]/g)].map((m) => m[0].trim());
    const ff = [...out.matchAll(/@font-face\s*\{[^}]*\}/g)].map((m) => m[0].replace(/\s+/g, ' ')).filter((t) => /bodoni/i.test(t));
    const pr = [...out.matchAll(/[^\n]*@property --accent[^\n]*/g)].map((m) => m[0].trim());
    const th = [...out.matchAll(/\.t-headline\s*\{[^}]*\}/g)].map((m) => m[0].replace(/\s+/g, ' '));
    vyvod = { fd, ff: ff.slice(0, 4), pr, th };
  } catch (e) { vyvod = `compile бросил: ${String(e.message).split('\n')[0]}`; }
  console.log(`\n=== ${imya}\nсудья: ${bledy.length ? 'ОТКАЗ — ' + bledy.join(' | ') : 'СВЕРЕНО'}\nTailwind (build(${JSON.stringify(kand)})): ${JSON.stringify(vyvod, null, 1)}`);
}
