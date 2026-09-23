// node mesto.mjs <эталон.png> <снятый.png> x y w h — дифф по месту: внутри рамки (h1) и вне её
import { readFileSync } from 'node:fs';
import { decodePng } from '../../../../core/accept/pixels.mjs';
const [, , a, b, ...r] = process.argv;
const [x0, y0, w, h] = r.map(Number);
const A = decodePng(readFileSync(a)), B = decodePng(readFileSync(b));
if (A.width !== B.width || A.height !== B.height) { console.log('размеры разные'); process.exit(1); }
const ch = A.data.length / (A.width * A.height);
const st = () => ({ sub: 0, max: 0, hist: {} });
const inn = st(), out = st();
let outMaxY = -1;
for (let y = 0; y < A.height; y++) for (let x = 0; x < A.width; x++) {
  const i = (y * A.width + x) * ch;
  const w_ = x >= x0 && x < x0 + w && y >= y0 && y < y0 + h ? inn : out;
  for (let k = 0; k < 3; k++) {
    const d = Math.abs(A.data[i + k] - B.data[i + k]);
    if (!d) continue;
    w_.sub++; if (d > w_.max) w_.max = d; w_.hist[d] = (w_.hist[d] ?? 0) + 1;
    if (w_ === out && y > outMaxY) outMaxY = y;
  }
}
const top = (s) => Object.entries(s.hist).sort((p, q) => q[1] - p[1]).slice(0, 4).map(([d, n]) => `|Δ|=${d}×${n}`).join(' ');
console.log(`рамка h1 [${x0},${y0},${w},${h}]: ${inn.sub} субпикселей, макс ${inn.max}`);
console.log(`вне рамки: ${out.sub} субпикселей, макс ${out.max}, нижняя строка с диффом ${outMaxY}; ${top(out)}`);
