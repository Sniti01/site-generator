// Сверка 94 проб: прежний --selftest (znak.mjs до 5c9c582) против PROBY нынешнего znak.test.mjs — текстом каждой пробы.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const P = import.meta.dirname;
const staryi = readFileSync(join(P, 'znak-do.mjs'), 'utf8');
const novyi = readFileSync('D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/testy/znak.test.mjs', 'utf8');
const vyrez = (s, ot, doo) => s.slice(s.indexOf(ot) + ot.length, s.indexOf(doo, s.indexOf(ot)));
const probyIz = (tekst) => tekst.split(/\n/).flatMap((l) => l.split(/(?<=\],)\s+(?=\[')/)).map((l) => l.trim()).filter((l) => l.startsWith("['"));
const a = probyIz(vyrez(staryi, 'const proby = [', '\n  ];'));
const b = probyIz(vyrez(novyi, 'const PROBY = [', '\n];'));
console.log(`прежних ${a.length}, нынешних ${b.length}`);
let raznyh = 0;
for (let k = 0; k < Math.max(a.length, b.length); k++) {
  if (a[k] !== b[k]) {
    raznyh++;
    console.log(`#${k}\n  было: ${a[k]}\n  есть: ${b[k]}`);
  }
}
console.log(`различий: ${raznyh}`);
// Строгое правило: прежнее выражение ok и нынешнее sudit на наборах строк отказа.
const vidySluchai = [
  [[], null], [['x'], null], [[], 'a'], [['a1'], 'a'], [['a1', 'b'], 'a'], [['a1', 'b1'], ['a', 'b']], [['a1'], ['a', 'b']], [['a1', 'a2'], ['a']],
];
const okStaryi = (bledy, zhdem) => { const vidy = zhdem === null ? [] : [].concat(zhdem); return zhdem === null ? bledy.length === 0 : bledy.length > 0 && bledy.every((x) => vidy.some((v) => x.includes(v))) && vidy.every((v) => bledy.some((x) => x.includes(v))); };
const assert = (await import('node:assert/strict')).default;
function sudit(bledy, zhdem) {
  const vidy = zhdem === null ? [] : [].concat(zhdem);
  if (zhdem === null) return assert.deepEqual(bledy, [], '');
  assert.ok(bledy.length > 0);
  assert.deepEqual(bledy.filter((x) => !vidy.some((v) => x.includes(v))), []);
  assert.deepEqual(vidy.filter((v) => !bledy.some((x) => x.includes(v))), []);
}
for (const [bl, zh] of vidySluchai) {
  let okN = true;
  try { sudit(bl, zh); } catch { okN = false; }
  console.log(`правило: ${JSON.stringify(bl)} ждём ${JSON.stringify(zh)} — прежнее ${okStaryi(bl, zh)}, нынешнее ${okN}${okStaryi(bl, zh) === okN ? '' : '  РАЗНОЕ'}`);
}
