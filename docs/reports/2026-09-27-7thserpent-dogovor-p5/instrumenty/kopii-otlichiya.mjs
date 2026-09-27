// Копия docs/reports/2026-09-27-7thserpent-pachka-5/instrumenty/kopii-otlichiya.mjs (сессия 18) для сессии 19 (П100); отличие —
// список пар PARY (копии этой сессии и новые инструменты против образцов) и эти три строки шапки. Новые инструменты
// (chuzhie-glavy.mjs, kadry-glavy.js) — не копии: их пары показывают отличия от образца для доклада, а не «разрешённые».
// Отличия копий инструментов пачки 5 от их источников (П98, «Вне объёма»: копии «отличные только адресом сервера,
// хешем сборки, папкой вывода и списками страниц») — построчный дифф по наибольшей общей подпоследовательности:
// «-» — строка источника, которой в копии нет, «+» — строка копии, которой нет в источнике. Только чтение.
// Вывод читается глазами: разрешённые отличия — строки шапки о копии, BASE, SBORKA, DIR/dir, списки страниц
// и имена файлов в строке запуска; всё прочее — отказ, который называется в докладе.
//   node kopii-otlichiya.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const zdes = dirname(fileURLToPath(import.meta.url));
const r = (p) => join(zdes, '../..', p);
const PARY = [
  ['vneshnie-brauzer.js', '2026-09-27-7thserpent-pachka-5/instrumenty/vneshnie-brauzer.js'],
  ['priemka.mjs', '2026-09-27-7thserpent-pachka-5/instrumenty/priemka.mjs'],
  ['chuzhie-glavy.mjs', '2026-09-27-7thserpent-pachka-4/instrumenty/chuzhie-repliki.mjs'],
  ['kadry-glavy.js', '2026-09-27-7thserpent-pachka-5/instrumenty/kadry-stopa.js'],
];
function diff(a, b) {
  const n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) out.push('-' + a[i++]); else out.push('+' + b[j++]);
  }
  while (i < n) out.push('-' + a[i++]);
  while (j < m) out.push('+' + b[j++]);
  return out;
}
for (const [kopiya, istochnik] of PARY) {
  const a = readFileSync(r(istochnik), 'utf8').split('\n');
  const b = readFileSync(join(zdes, kopiya), 'utf8').split('\n');
  const d = diff(a, b);
  console.log(`=== ${kopiya} против ${istochnik}: строк отличий ${d.length}`);
  for (const s of d) console.log(s);
}
