// Два журнала сборки строка в строку без ANSI, времени, длительностей и шапки priemka.mjs: node zhurnal-bez-vremeni.mjs <a> <b>
import { readFileSync } from 'node:fs';
const chistit = (t) =>
  t
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/\r/g, '')
    .split('\n')
    .filter((s) => !/^\$ |^\(папка: |^код выхода: /.test(s))
    .map((s) => s.replace(/^\d\d:\d\d:\d\d\s*/, '').replace(/\(\+?\d+(\.\d+)?\s*m?s\)/g, '(<t>)').replace(/\b\d+(\.\d+)?\s*m?s\b/g, '<t>').trimEnd())
    .filter((s) => s !== '');
const [a, b] = process.argv.slice(2).map((f) => chistit(readFileSync(f, 'utf8')));
console.log(`строк: ${a.length} / ${b.length}`);
const n = Math.max(a.length, b.length);
let raz = 0;
for (let i = 0; i < n; i++) if (a[i] !== b[i]) { raz += 1; if (raz <= 15) console.log(`#${i}\n  A: ${a[i]}\n  B: ${b[i]}`); }
console.log(`различий по порядку: ${raz}`);
// Без порядка (оптимизация картинок идёт параллельно): счёт строк, номер «(k/n)» снят.
const bezNomera = (s) => s.replace(/\(\d+\/\d+\)$/, '(k/n)');
const schet = (m) => m.reduce((k, s) => k.set(bezNomera(s), (k.get(bezNomera(s)) ?? 0) + 1), new Map());
const [ka, kb] = [schet(a), schet(b)];
const tolkoA = [...ka].filter(([s, c]) => (kb.get(s) ?? 0) < c).map(([s]) => s);
const tolkoB = [...kb].filter(([s, c]) => (ka.get(s) ?? 0) < c).map(([s]) => s);
console.log(`без порядка: только в A ${tolkoA.length}, только в B ${tolkoB.length}`);
for (const s of tolkoA.slice(0, 10)) console.log(`  A: ${s}`);
for (const s of tolkoB.slice(0, 10)) console.log(`  B: ${s}`);
