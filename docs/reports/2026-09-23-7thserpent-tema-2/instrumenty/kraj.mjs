// node kraj.mjs <png> — цвета у правого края кадра (полоса прокрутки): столбцы w-16…w-1, строки 0…h
import { readFileSync } from 'node:fs';
import { decodePng } from '../../../../core/accept/pixels.mjs';
const [, , f] = process.argv;
const im = decodePng(readFileSync(f));
const ch = im.data.length / (im.width * im.height);
const hex = (x, y) => { const i = (y * im.width + x) * ch; return '#' + [0, 1, 2].map((k) => im.data[i + k].toString(16).padStart(2, '0')).join(''); };
console.log(`${im.width}×${im.height}`);
// где кончается содержимое: первый столбец справа, одинаковый по всей высоте
for (const y of [5, 100, 300, 450, 700, 890]) {
  const row = [];
  for (let x = im.width - 16; x < im.width; x++) row.push(hex(x, y));
  console.log('y' + y + ': ' + row.join(' '));
}
// подсчёт цветов в последних 12 столбцах
const cnt = new Map();
for (let y = 0; y < im.height; y++) for (let x = im.width - 12; x < im.width; x++) { const h = hex(x, y); cnt.set(h, (cnt.get(h) ?? 0) + 1); }
console.log([...cnt].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([h, n]) => h + '×' + n).join('  '));
