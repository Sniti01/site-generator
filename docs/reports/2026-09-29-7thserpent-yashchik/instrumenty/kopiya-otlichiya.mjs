// Копия против источника построчно (сессия 23): разрешённое отличие копии модели сборки CI — только строка папки ZDES.
//   node kopiya-otlichiya.mjs <источник> <копия>
import { readFileSync } from 'node:fs';

const [a, b] = process.argv.slice(2);
const [x, y] = [readFileSync(a, 'utf8').split('\n'), readFileSync(b, 'utf8').split('\n')];
const raz = [];
for (let i = 0; i < Math.max(x.length, y.length); i++) if (x[i] !== y[i]) raz.push(`строка ${i + 1}:\n  источник: ${x[i] ?? '—'}\n  копия:    ${y[i] ?? '—'}`);
console.log(`источник: ${a} (${x.length} строк)\nкопия:    ${b} (${y.length} строк)\nразличных строк: ${raz.length}`);
for (const r of raz) console.log(r);
