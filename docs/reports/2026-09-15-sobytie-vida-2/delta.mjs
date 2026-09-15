// node delta.mjs <a.png> <b.png> [порог] — гистограмма |Δ| и полосы строк, где |Δ| > порог
import { readFileSync } from 'node:fs';
import { decodePng } from 'file:///D:/SEO/cloud/site-generator/core/accept/pixels.mjs';
const [, , A, B, thr = '2'] = process.argv;
const a = decodePng(readFileSync(A)), b = decodePng(readFileSync(B));
const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
const hist = new Map(); const rows = new Map(); let n = 0;
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
  const ia = (y * a.width + x) * a.channels, ib = (y * b.width + x) * b.channels;
  for (let c = 0; c < 3; c++) { const d = Math.abs(a.data[ia + c] - b.data[ib + c]); if (!d) continue; n++; hist.set(d, (hist.get(d) ?? 0) + 1); if (d > +thr) { const k = Math.floor(y / 100) * 100; rows.set(k, (rows.get(k) ?? 0) + 1); } }
}
console.log('размеры', a.width + '×' + a.height, b.width + '×' + b.height, 'различных субпикселей', n);
console.log('гистограмма |Δ| (первые 12):', [...hist].sort((p, q) => p[0] - q[0]).slice(0, 12).map(([d, c]) => d + ':' + c).join(' '), '… макс', Math.max(...hist.keys()));
console.log('полосы по 100 px с |Δ| >', thr, ':', [...rows].sort((p, q) => p[0] - q[0]).map(([y, c]) => y + ':' + c).join(' '));
