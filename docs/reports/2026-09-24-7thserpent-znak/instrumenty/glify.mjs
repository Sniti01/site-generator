// Контуры надписи гарнитурой темы — для эскизов знака (сессия 11, П83).
// Буквы знака — графика (логотип), а не текст страницы: роль `.t-*` к ним
// не применяется, гарнитура — только темы (Bodoni Moda 600 или Public Sans 600,
// файлы @fontsource, OFL). Кернинга нет (fontkitten без раскладки) — только
// разрядка; для капсов с разрядкой этого достаточно.
//
//   node glify.mjs --font bodoni|sans --size 20 --track 0.08 --text "7TH SERPENT" [--x 0] [--y 0]
//
// Печатает JSON: { d, width, ascent, capHeight, size } — `d` уже в пикселях
// при заданном кегле, базовая линия на y (по умолчанию — высота капсов,
// то есть верх капсов в 0).
import { readFileSync } from 'node:fs';
import * as fk from 'file:///D:/SEO/cloud/site-generator/node_modules/fontkitten/dist/index.js';

const FONTS = {
  bodoni: 'D:/SEO/cloud/site-generator/node_modules/@fontsource/bodoni-moda/files/bodoni-moda-latin-600-normal.woff',
  sans: 'D:/SEO/cloud/site-generator/node_modules/@fontsource/public-sans/files/public-sans-latin-600-normal.woff',
};

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : dflt;
};

const font = fk.create(readFileSync(FONTS[arg('font', 'bodoni')]));
const size = Number(arg('size', '20'));
const track = Number(arg('track', '0'));
const text = arg('text', '7TH SERPENT');
const x0 = Number(arg('x', '0'));
const s = size / font.unitsPerEm;
const cap = (font.capHeight ?? font.ascent * 0.7) * s;
const yBase = Number(arg('y', String(cap)));

let x = x0;
const parts = [];
for (const ch of text) {
  const g = font.glyphForCodePoint(ch.codePointAt(0));
  const d = g.path.scale(s, -s).translate(x, yBase).toSVG();
  if (d) parts.push(d);
  x += g.advanceWidth * s + track * size;
}
const width = x - x0 - track * size;
console.log(JSON.stringify({ d: parts.join(''), width: +width.toFixed(2), capHeight: +cap.toFixed(2), size }, null, 0));
