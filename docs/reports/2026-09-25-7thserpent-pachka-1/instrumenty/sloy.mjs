// Слой утилит сборки — функциями разбора замороженной сверки сессии 13
// (`docs/reports/2026-09-25-7thserpent-tailwind-zona/instrumenty/sverka-css.mjs`: razobrat,
// импорт, без правки). Только чтение.
//
//   node sloy.mjs <dist>
//
// ИСТОЧНИКИ CSS — все файлы `.css` по всему дереву сборки и каждый встроенный <style>
// в HTML (Astro встраивает малые листы в страницу: у страниц маршрута — 198 байт правил
// маршрута) — «судью судят», раунд 1, R1-INSTR-9: первая редакция читала только
// `_astro/*.css` верхнего уровня.
// СЛОЙ — каждый блок `@layer <имя>` на любой глубине (внутри @media, @supports, другого
// @layer), чьё полное имя кончается на `utilities` (`utilities`, `tw.utilities`, вложенный
// `@layer tw { @layer utilities }`). Счёт — прямые дети-правила такого блока (правило,
// @-правило с блоком или инструкция — по одному, как `sloyUtilit` сверки сессии 13).
// Печатается число правил, их прелюдии и где лежит каждый блок; итог — сумма.
// Отказ (код 2): нет папки или ни одного источника CSS.
// ПРЕДЕЛЫ (названы): утилита вне слоя utilities (Tailwind так не печатает) не считается;
// сравнение с другой сборкой — по напечатанным спискам, вручную или diff.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const S = await import(pathToFileURL('D:/SEO/cloud/site-generator/docs/reports/2026-09-25-7thserpent-tailwind-zona/instrumenty/sverka-css.mjs').href);
const dist = process.argv[2];
if (!dist || !statSync(dist, { throwIfNoEntry: false })?.isDirectory()) {
  console.error('нет папки сборки: ' + dist);
  process.exit(2);
}
const files = [];
const walk = (d) => { for (const f of readdirSync(d).sort()) { const p = join(d, f); statSync(p).isDirectory() ? walk(p) : files.push(p); } };
walk(dist);

const istochniki = [];
for (const f of files) {
  const ext = extname(f).toLowerCase();
  const rel = f.slice(dist.length).replace(/\\/g, '/');
  if (ext === '.css') istochniki.push([rel, readFileSync(f, 'utf8')]);
  else if (ext === '.html' || ext === '.htm') {
    let i = 0;
    for (const m of readFileSync(f, 'utf8').matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) istochniki.push([`${rel} <style> №${++i}`, m[1]]);
  }
}
if (!istochniki.length) {
  console.error('в сборке нет ни одного источника CSS');
  process.exit(2);
}

function obkhod(uzly, put, gde, out) {
  for (const u of uzly) {
    if (u.tip !== 'blok') continue;
    const sloyM = (u.prelude || '').match(/^@layer\s+([\w.-]+)\s*$/i);
    const imya = sloyM ? [...put, sloyM[1]].join('.') : null;
    const novyPut = sloyM ? [...put, sloyM[1]] : put;
    if (imya && /(^|\.)utilities$/i.test(imya)) {
      const pravila = u.deti.filter((x) => x.tip === 'blok' || x.tip === 'instr');
      out.push({ gde, imya, n: pravila.length, prelyudii: pravila.map((x) => String(x.prelude ?? x.tekst ?? '').slice(0, 60)) });
    }
    if (u.deti) obkhod(u.deti, novyPut, gde, out);
  }
}

const bloki = [];
for (const [gde, t] of istochniki) obkhod(S.razobrat(t), [], gde, bloki);
let vsego = 0;
for (const b of bloki) {
  vsego += b.n;
  console.log(`${b.gde}: @layer ${b.imya} — правил ${b.n}${b.n ? ': ' + b.prelyudii.join(' | ') : ''}`);
}
console.log(`источников CSS: ${istochniki.length} (файлов ${istochniki.filter(([g]) => !g.includes('<style>')).length}, встроенных <style> ${istochniki.filter(([g]) => g.includes('<style>')).length}); блоков слоя utilities: ${bloki.length}`);
console.log(`всего: ${vsego}`);
