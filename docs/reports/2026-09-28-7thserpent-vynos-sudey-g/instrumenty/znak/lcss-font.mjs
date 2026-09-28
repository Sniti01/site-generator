// Есть ли lightningcss и как он читает font-family (оракул для хвоста списка --font-display).
import { createRequire } from 'node:module';

const req = createRequire('D:/SEO/cloud/site-generator/sites/7thserpent.com/package.json');
let put;
try {
  put = req.resolve('lightningcss');
} catch (e) {
  console.log('lightningcss не найден из сайта: ' + e.message.split('\n')[0]);
  const req2 = createRequire(req.resolve('@tailwindcss/node'));
  put = req2.resolve('lightningcss');
}
const lc = req(put);
console.log('lightningcss:', put, req(put.replace(/node[\\/]index\.js$/, 'package.json')).version);
const sluchai = [
  "'Bodoni Moda', ui-serif, Georgia, 'Times New Roman', serif",
  "'Bodoni Moda',, serif",
  "'Bodoni Moda', 'Public Sans' 'X'",
  "'Bodoni Moda', 10px",
  "'Bodoni Moda', Times New Roman, serif",
  "'Bodoni Moda', serif,",
  "'Bodoni Moda', initial",
  "'Bodoni Moda', default",
  "'Bodoni Moda' serif",
  "'Bodoni Moda', \"x\" y",
  "'Bodoni Moda', 3d",
];
for (const v of sluchai) {
  const css = `.a{font-family:${v}}`;
  const w = [];
  let out = '';
  try {
    const r = lc.transform({ filename: 'a.css', code: Buffer.from(css), errorRecovery: true, minify: true });
    out = r.code.toString();
    for (const x of r.warnings) w.push(x.message);
  } catch (e) {
    out = 'ОШИБКА: ' + e.message;
  }
  console.log(`${v.padEnd(60)} → ${out}${w.length ? '  [предупр.: ' + w.join('; ') + ']' : ''}`);
}
