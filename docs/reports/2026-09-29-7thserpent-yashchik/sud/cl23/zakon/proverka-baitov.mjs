// Байты копии: невидимый знак в norm() инструмента и окончания/BOM нашего robots.txt.
import { readFileSync, writeFileSync } from 'node:fs';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/e23fb3af-937c-42f5-91ca-cf6567cf6a1c/scratchpad/sud-cl23-z';
const instr = readFileSync(`${PAPKA}/sites/7thserpent.com/tools/check-live.mjs`, 'utf8');
const i = instr.indexOf('const norm');
const stroka = instr.slice(i, instr.indexOf('\n', i));
const vidno = [...stroka].map((c) => (c.charCodeAt(0) > 127 ? `<U+${c.charCodeAt(0).toString(16).toUpperCase()}>` : c)).join('');

const r = readFileSync(`${PAPKA}/sites/7thserpent.com/public/robots.txt`);
const cr = [...r].filter((b) => b === 13).length;
const lf = [...r].filter((b) => b === 10).length;
const bom = r[0] === 0xef && r[1] === 0xbb && r[2] === 0xbf;
const neAscii = [...r.toString('utf8')].filter((c) => c.charCodeAt(0) > 127).map((c) => `U+${c.charCodeAt(0).toString(16).toUpperCase()}`);

const vyvod = [
  `norm(): ${vidno}`,
  `robots.txt: байт ${r.length}, CR ${cr}, LF ${lf}, BOM ${bom ? 'да' : 'нет'}, последний байт ${r[r.length - 1]}, не-ASCII знаки: ${neAscii.join(' ') || 'нет'}`,
].join('\n');
writeFileSync(`${PAPKA}/proverka-baitov.txt`, vyvod + '\n');
console.log(vyvod);
