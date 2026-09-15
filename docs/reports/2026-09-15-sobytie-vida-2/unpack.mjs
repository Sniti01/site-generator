// node unpack.mjs <папка с wynik.json> — раскладывает результат съёмки в geometria.json / miejsca.json / log.txt
import { readFileSync, writeFileSync } from 'node:fs';
const dir = process.argv[2];
if (!dir) { console.error('unpack.mjs <папка>'); process.exit(2); }
let d = JSON.parse(readFileSync(`${dir}/wynik.json`, 'utf8').trim());
if (typeof d === 'string') d = JSON.parse(d);
writeFileSync(`${dir}/geometria.json`, JSON.stringify(d.geometria, null, 2) + '\n');
writeFileSync(`${dir}/miejsca.json`, JSON.stringify(d.miejsca, null, 1) + '\n');
writeFileSync(`${dir}/log.txt`, d.log.join('\n') + '\n');
console.log(`ok ${dir}: высоты ${d.geometria['1440']['высота']} / ${d.geometria['390']['высота']}; кадров ${Object.keys(d.miejsca['1440'].scrollY).length}`);
