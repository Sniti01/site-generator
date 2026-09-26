// Разница двух папок кадров PNG по одноимённым файлам (сессия 16) — сколько субпикселей отличается,
// наибольшее отклонение и рамка различий. Только чтение; декодер — core/accept/pixels.mjs (тот же,
// что у accept:frames).
//
//   node razn-kadrov.mjs <папка-до> <папка-после>
//
// Разный размер кадра — строка «размер», без счёта. Файлы только в одной папке — строка «нет пары».
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { decodePng } from '../../../../core/accept/pixels.mjs';

const [, , a, b] = process.argv;
if (!a || !b) {
  console.error('node razn-kadrov.mjs <папка-до> <папка-после>');
  process.exit(2);
}
const imena = [...new Set([...readdirSync(a), ...readdirSync(b)])].filter((f) => f.endsWith('.png')).sort();
for (const f of imena) {
  if (!existsSync(join(a, f)) || !existsSync(join(b, f))) {
    console.log(`${f}: нет пары`);
    continue;
  }
  const x = decodePng(readFileSync(join(a, f)));
  const y = decodePng(readFileSync(join(b, f)));
  if (x.width !== y.width || x.height !== y.height) {
    console.log(`${f}: размер ${x.width}×${x.height} → ${y.width}×${y.height}`);
    continue;
  }
  let n = 0;
  let max = 0;
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  const k = x.data.length / (x.width * x.height);
  for (let i = 0; i < x.data.length; i++) {
    const d = Math.abs(x.data[i] - y.data[i]);
    if (!d || i % k === 3) continue;
    n += 1;
    if (d > max) max = d;
    const p = Math.floor(i / k);
    const px = p % x.width;
    const py = Math.floor(p / x.width);
    if (px < x0) x0 = px;
    if (py < y0) y0 = py;
    if (px > x1) x1 = px;
    if (py > y1) y1 = py;
  }
  console.log(`${f}: ${x.width}×${x.height}, субпикселей ${n}, макс ${max}` + (n ? `, рамка ${x1 - x0 + 1}×${y1 - y0 + 1} от (${x0}, ${y0})` : ''));
}
