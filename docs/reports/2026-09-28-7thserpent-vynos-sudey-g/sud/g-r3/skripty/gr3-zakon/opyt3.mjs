// Ветви источников сканера (root null и root 'none') — пробы, которые их различают без записи в сайт: утилита с чужой
// гарнитурой в импортированном листе под именем-словом, которое есть в зоне сканера (или только вне её).
//   node opyt3.mjs   (крюк мутации — по желанию, через opyt3-zapusk.mjs)
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SAYT = 'D:/SEO/cloud/site-generator/sites/7thserpent.com';
const { sverka, wejscie } = await import(pathToFileURL(join(SAYT, 'tools/znak.mjs')).href);
const LISTY = join(import.meta.dirname, 'listy3');
mkdirSync(LISTY, { recursive: true });
const put = (p) => p.replace(/\\/g, '/');
const baza = wejscie();
const czyste = () => ({ ...baza, znak: structuredClone(baza.znak), publiczne: null });
const POSLE_YADRA = "@import '@factory/core/styles/a11y.css';";
const TW = "@import 'tailwindcss' source('../../src');";
function zam(s, iz, na) {
  if (s.split(iz).length !== 2) throw new Error(`порча не применилась: ${iz}`);
  return s.replace(iz, () => na);
}
const utilita = (slovo) => {
  const f = join(LISTY, `u-${slovo}.css`);
  writeFileSync(f, `@utility ${slovo} { --font-display: Georgia, serif; }\n`);
  return put(f);
};
const SLUCHAI = [
  // hero — слово src/ сайта; proverki — только вне src/ (package.json, tools/), в src/ и core/**/*.astro его нет.
  ['A1 без source() — корень сайта; утилита hero (слово src/)', (w) => { w.css = zam(zam(w.css, TW, "@import 'tailwindcss';"), POSLE_YADRA, `${POSLE_YADRA}\n@import '${utilita('hero')}';`); return w; }, 'отказ'],
  ['A2 без source(); утилита proverki (слово вне src/, в корне сайта)', (w) => { w.css = zam(zam(w.css, TW, "@import 'tailwindcss';"), POSLE_YADRA, `${POSLE_YADRA}\n@import '${utilita('proverki')}';`); return w; }, 'отказ'],
  ["B1 source(none) + @source '../../src'; утилита proverki — вне зоны", (w) => { w.css = zam(zam(w.css, TW, "@import 'tailwindcss' source(none);\n@source '../../src';"), POSLE_YADRA, `${POSLE_YADRA}\n@import '${utilita('proverki')}';`); return w; }, 'сверено'],
  ["B2 source('../../src') (как сейчас); утилита proverki — вне зоны", (w) => { w.css = zam(w.css, POSLE_YADRA, `${POSLE_YADRA}\n@import '${utilita('proverki')}';`); return w; }, 'сверено'],
];
for (const [imya, mut, zhdem] of SLUCHAI) {
  const { bledy } = await sverka(mut(czyste()));
  const fakt = bledy.length ? 'отказ' : 'сверено';
  console.log(`${imya}: ждём ${zhdem}, факт ${fakt}${bledy.length ? ` — ${bledy.map((b) => b.slice(0, 160)).join(' | ')}` : ''}`);
}
