// Две сборки побайтно: node sravnit-dist.mjs <опорная> <новая> — файлы только в одной, различные (sha256), равные.
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const [a, b] = process.argv.slice(2);
if (!a || !b) {
  console.error('node sravnit-dist.mjs <опорная> <новая>');
  process.exit(2);
}
const obhod = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? obhod(join(d, n)) : [join(d, n)]));
const spisok = (d) => new Map(obhod(d).map((f) => [relative(d, f).replace(/\\/g, '/'), createHash('sha256').update(readFileSync(f)).digest('hex')]));
const [A, B] = [spisok(a), spisok(b)];
const tolkoA = [...A.keys()].filter((f) => !B.has(f)).sort();
const tolkoB = [...B.keys()].filter((f) => !A.has(f)).sort();
const raznye = [...A.keys()].filter((f) => B.has(f) && A.get(f) !== B.get(f)).sort();
const ravnye = [...A.keys()].filter((f) => B.has(f) && A.get(f) === B.get(f)).length;
console.log(`опорная: ${A.size} файлов; новая: ${B.size} файлов`);
console.log(`равных побайтно: ${ravnye}`);
console.log(`различных: ${raznye.length}${raznye.length ? ' — ' + raznye.join(', ') : ''}`);
console.log(`только в опорной (пропали): ${tolkoA.length}${tolkoA.length ? ' — ' + tolkoA.join(', ') : ''}`);
console.log(`только в новой (новые): ${tolkoB.length}${tolkoB.length ? ' — ' + tolkoB.join(', ') : ''}`);
