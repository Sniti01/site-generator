// GR3-klass K4: список --font-display, который судья читает как font-family, а CSS — нет.
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const { sverka, wejscie, drzewoCss, spisokGarniturChitaetsya } = await import('file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs');
const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const require = createRequire(join(SAYT, 'package.json'));
const viteReq = createRequire(require.resolve('@tailwindcss/vite'));
const twNode = await import(pathToFileURL(viteReq.resolve('@tailwindcss/node')).href);
const lcss = await import(pathToFileURL(createRequire(viteReq.resolve('@tailwindcss/node')).resolve('lightningcss')).href);
const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
const STAR = "--font-display: 'Bodoni Moda', ui-serif, Georgia, 'Times New Roman', serif;";
const SLUCHAI = [
  ['kontrol', "'Bodoni Moda', ui-serif, Georgia, 'Times New Roman', serif"],
  ['родовое имя первым в цепочке имён: serif Georgia', "'Bodoni Moda', serif Georgia"],
  ['родовое имя первым в цепочке имён: sans-serif Moda', "'Bodoni Moda', sans-serif Moda"],
  ['родовое имя первым в цепочке имён: monospace x', "'Bodoni Moda', monospace x, serif"],
  ['перевод строки внутри строки', "'Bodoni Moda', 'Times\nNew Roman', serif"],
];
for (const [imya, v] of SLUCHAI) {
  const w = czyste();
  if (w.css.split(STAR).length !== 2) throw new Error('порча не применилась');
  w.css = w.css.replace(STAR, () => `--font-display: ${v};`);
  const { bledy } = await sverka(w);
  // Что читает lightningcss (разбор CSS сайта) в font-family с этим списком — не браузер, но парсер CSS по спецификации.
  const r = lcss.transform({ filename: 'x.css', code: Buffer.from(`.a { font-family: ${v}; }`), minify: false, errorRecovery: true });
  console.log(`=== ${imya}\n  spisokGarniturChitaetsya: ${spisokGarniturChitaetsya(v)}\n  вердикт: ${bledy.length ? 'ОТКАЗ ' + bledy.map((b) => b.slice(0, 160)).join(' | ') : 'СВЕРЕНО'}\n  lightningcss font-family: ${r.code.toString().replace(/\s+/g, ' ')} предупреждений ${r.warnings.length}${r.warnings.length ? ': ' + r.warnings.map((x) => x.message).join('; ') : ''}`);
}
