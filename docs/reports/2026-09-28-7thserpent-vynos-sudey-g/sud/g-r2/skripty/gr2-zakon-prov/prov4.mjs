// Свой член класса GR2-Z-1: грани гарнитуры темы с unicode-range (сводный лист 600.css и latin-ext с диапазоном)
// рядом с latin-600 — буквы знака (латиница) они не берут; что говорит судья.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { sverka, wejscie, IMPORT_GARNITURY } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs';

const req = createRequire('D:/SEO/cloud/site-generator/sites/7thserpent.com/package.json');
const FILES = req.resolve('@fontsource/bodoni-moda/latin-600.css').replace(/\\/g, '/').replace(/latin-600\.css$/, 'files/');
const PAPKA = join(import.meta.dirname, 'vhody');
mkdirSync(PAPKA, { recursive: true });
const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
const I = `@import '${IMPORT_GARNITURY}';`;
const dop = (p) => (w) => { w.css = w.css.replace(I, () => `${I}\n@import '${p}';`); return w; };
const f = join(PAPKA, 'latin-ext-diapazon.css');
writeFileSync(f, `@font-face { font-family: 'Bodoni Moda'; font-style: normal; font-weight: 600; src: url(${FILES}bodoni-moda-latin-ext-600-normal.woff2) format('woff2'); unicode-range: U+0100-024F; }\n`);
const SLUCHAI = [
  ['сводный 600.css рядом с latin-600 (Ł, ő в именах)', dop('@fontsource/bodoni-moda/600.css')],
  ['latin-ext 600 файлом пакета с unicode-range U+0100-024F', dop(f.replace(/\\/g, '/'))],
];
for (const [imya, mut] of SLUCHAI) {
  const { bledy } = await sverka(mut(czyste()));
  console.log(`== ${imya}: ${bledy.length ? `ОТКАЗ (${bledy.length})` : 'сверено'}`);
  for (const b of bledy) console.log(`   - ${b.slice(0, 260)}`);
}
