// Законная раскладка источников Tailwind: автоматическое обнаружение (без source()) и явный корень сайта.
// Что говорит судья и откуда кандидат с чужим --font-display (сканер oxide по тем же источникам).
//   node zakon2.mjs > zakon2.txt
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { sverka, wejscie } from 'file:///D:/SEO/cloud/site-generator/sites/7thserpent.com/tools/znak.mjs';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const req = createRequire(`${SAYT}/package.json`);
const viteReq = createRequire(req.resolve('@tailwindcss/vite'));
const { Scanner } = await import(pathToFileURL(viteReq.resolve('@tailwindcss/oxide')).href);

const baza = wejscie();
const { pliki } = await sverka({ ...baza, publiczne: null });
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: new Map(pliki) });
const ISH = "@import 'tailwindcss' source('../../src');";
const SLUCHAI = [
  ['контроль', ISH],
  ["@import 'tailwindcss'; (автоматическое обнаружение источников)", "@import 'tailwindcss';"],
  ["@import 'tailwindcss' source('../..'); (корень сайта явно)", "@import 'tailwindcss' source('../..');"],
];
for (const [imya, na] of SLUCHAI) {
  const w = czyste();
  if (w.css.split(ISH).length !== 2) throw new Error('порча не применилась');
  w.css = w.css.replace(ISH, () => na);
  const t0 = Date.now();
  const { bledy } = await sverka(w);
  console.log(`== ${imya}: ${bledy.length ? `ОТКАЗ (${bledy.length})` : 'сверено'} за ${Date.now() - t0} мс`);
  for (const b of bledy) console.log(`   - ${b}`);
}
// Откуда кандидат: сканер по корню сайта (как root === null у судьи и у плагина Vite: base — корень Vite = сайт).
const sc = new Scanner({ sources: [{ base: SAYT, pattern: '**/*', negated: false }, { base: `${SAYT}/src/content`, pattern: '**/*', negated: true }] });
const kand = sc.scan().filter((k) => k.includes('--font-display'));
console.log(`\nкандидаты сканера с --font-display: ${kand.join(' ')}`);
const faily = sc.files.filter((f) => /znak\.test\.mjs$|znak-sborka\.test\.mjs$/.test(f));
console.log(`файлы тестов в зоне сканера: ${faily.join(' | ')}`);
