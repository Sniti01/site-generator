// GR1-Z: 94 пробы теста против прежнего --selftest (znak.mjs на df8b064 = 3b78f28): текст проб и помощников
// без пробельных знаков; правило пробы.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const stary = readFileSync(join(import.meta.dirname, 'znak-df8b064.mjs.txt'), 'utf8');
const novy = readFileSync('D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/testy/znak.test.mjs', 'utf8');
const bez = (s) => s.replace(/\s+/g, '');
const vyrez = (s, a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i); return i < 0 || j < 0 ? null : s.slice(i + a.length, j); };
const pS = vyrez(stary, 'const proby = [', '\n  ];');
const pN = vyrez(novy, 'const PROBY = [', '\n];');
console.log('пробы: без пробелов равны —', bez(pS) === bez(pN), '; строк проб', pS.split('\n').filter((l) => l.trim().startsWith("['")).length, pN.split('\n').filter((l) => l.trim().startsWith("['")).length);
for (const k of ['const czyste', 'const przedRoot', 'const glow', 'const icoZ', 'const theme', 'const font700', 'const cudzyRysunek', 'const I =', 'const { pliki }', 'const baza']) {
  const lS = stary.split('\n').find((l) => l.includes(k));
  const iN = novy.indexOf(k);
  const lN = iN < 0 ? null : novy.slice(iN, novy.indexOf(';\n', iN) + 1 > iN ? novy.indexOf(k === 'const przedRoot' || k === 'const glow' || k === 'const theme' ? '};' : ';\n', iN) + 2 : iN);
  console.log(k, '— прежний:', lS ? bez(lS).slice(0, 160) : 'НЕТ');
  console.log(' '.repeat(k.length), '— тест:   ', lN ? bez(lN).slice(0, 160) : 'НЕТ');
}
