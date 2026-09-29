// Счёт запретного сочетания в своих скриптах папки (сочетание собрано из кодов знаков, буквами не пишется).
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const PAPKA = 'C:/Users/MSI/AppData/Local/Temp/claude/d--SEO-cloud-site-generator/e23fb3af-937c-42f5-91ca-cf6567cf6a1c/scratchpad/sud-cl23-z';
const Z = String.fromCharCode(115, 101, 100);
const svoi = [...readdirSync(PAPKA).filter((f) => f.endsWith('.mjs')), 'pravka/vstavka-1.txt', 'pravka/vstavka-2.txt'];
const itog = [];
for (const f of svoi) {
  const t = readFileSync(`${PAPKA}/${f}`, 'utf8').toLowerCase();
  const n = t.split(Z).length - 1;
  itog.push(`${f}: ${n}${f.toLowerCase().includes(Z) ? ' (и в имени)' : ''}`);
}
writeFileSync(`${PAPKA}/schet.txt`, itog.join('\n') + '\n');
console.log(itog.join('\n'));
