// node unpack.mjs <папка с wynik.json> — раскладывает результат съёмки в geometria.json / miejsca.json / log.txt
// Копия 2026-09-15-sobytie-vida-2/unpack.mjs; добавлено: прогон visitor несёт только log (без геометрии и мест).
import { readFileSync, writeFileSync } from 'node:fs';
const dir = process.argv[2];
if (!dir) { console.error('unpack.mjs <папка>'); process.exit(2); }
let d = JSON.parse(readFileSync(`${dir}/wynik.json`, 'utf8').trim());
if (typeof d === 'string') d = JSON.parse(d);
writeFileSync(`${dir}/log.txt`, d.log.join('\n') + '\n');
if (!d.geometria) { console.log(`ok ${dir}: только log (${d.log.length} строк)`); process.exit(0); }
writeFileSync(`${dir}/geometria.json`, JSON.stringify(d.geometria, null, 2) + '\n');
writeFileSync(`${dir}/miejsca.json`, JSON.stringify(d.miejsca, null, 1) + '\n');
console.log(`ok ${dir}: высоты ${d.geometria['1440']['высота']} / ${d.geometria['390']['высота']}; кадров ${Object.keys(d.miejsca['1440'].scrollY).length}; якорей ${Object.keys(d.geometria['1440']['слои']).length}`);
