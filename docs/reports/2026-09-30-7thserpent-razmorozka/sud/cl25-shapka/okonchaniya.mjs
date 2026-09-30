// Окончания строк и длины строк шапки check-live (копия коммита 1480f7e).
import { readFileSync } from 'node:fs';

const PUT = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/d51cae6c-d4e2-44ee-ba52-f824f5c9a8b9/scratchpad/sud-cl25-shapka/k-1480f7e/sites/7thserpent.com/tools/check-live.mjs';
const b = readFileSync(PUT);
const t = b.toString('utf8');
console.log(`байт ${b.length}; CR ${[...t].filter((c) => c === '\r').length}; перевод строки в конце ${t.endsWith('\n')}`);
const stroki = t.split('\n');
const shapka = stroki.slice(0, 82);
const dliny = shapka.map((s, i) => [i + 1, [...s].length]);
console.log(`шапка: строк ${shapka.length}; самая длинная ${Math.max(...dliny.map(([, d]) => d))}; длиннее 120: ${dliny.filter(([, d]) => d > 120).map(([n, d]) => `${n}:${d}`).join(', ') || 'нет'}`);
console.log(`хвостовые пробелы в шапке: ${shapka.map((s, i) => [i + 1, s]).filter(([, s]) => /[ \t]$/.test(s)).map(([n]) => n).join(', ') || 'нет'}`);
console.log(`длины строк 19–26 и 35–36, 68–81: ${dliny.filter(([n]) => (n >= 19 && n <= 26) || (n >= 35 && n <= 36) || (n >= 68 && n <= 81)).map(([n, d]) => `${n}:${d}`).join(' ')}`);
