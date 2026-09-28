// Копии судьи головы: нынешний и мутанты; импорты — абсолютные на репозиторий. Тест head.test.mjs — копия на каждый вариант.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const TUT = dirname(fileURLToPath(import.meta.url));
const R = 'file:///D:/SEO/cloud/site-generator/core/';
const ish = readFileSync('D:/SEO/cloud/site-generator/core/gates/head.mjs', 'utf8')
  .replace("'../text/html.mjs'", `'${R}text/html.mjs'`)
  .replace("'../text/extract.mjs'", `'${R}text/extract.mjs'`);
const test = readFileSync('D:/SEO/cloud/site-generator/core/gates/head.test.mjs', 'utf8');

const zamena = (s, a, b) => {
  if (!s.includes(a)) throw new Error(`нет куска: ${a}`);
  return s.split(a).join(b);
};
const varianty = {
  nyne: ish,
  // цель имени — через tekstVsego (откат B3-1 только для цели)
  'cel-tekstVsego': zamena(ish, '.map((u) => yarlyk(tekst(u)))', '.map((u) => yarlyk(tekstVsego(u)))'),
  // откат B3-1 целиком
  'b31-celikom': zamena(ish, 'const tekst = skripty ? tekstSoSkriptami : tekstVsego;', 'const tekst = tekstVsego;'),
  // откат B3-3: сырые индексы
  'b33-syrye': zamena(ish, 'const rang = (x) => ({ ...x, poz: pozy.indexOf(x.poz) });', 'const rang = (x) => x;'),
  // B3-3 мутант 2: ранг только среди ссылок (текущее — сырой)
  'b33-tekushchee-syroe': zamena(ish, 'tekushchie: n.tekushchie.map(rang) }', 'tekushchie: n.tekushchie }'),
};
mkdirSync(join(TUT, 'var'), { recursive: true });
for (const [k, kod] of Object.entries(varianty)) {
  writeFileSync(join(TUT, 'var', `head-${k}.mjs`), kod);
  writeFileSync(join(TUT, 'var', `golova-${k}.test.mjs`), zamena(test, "from './head.mjs'", `from './head-${k}.mjs'`));
}
console.log(Object.keys(varianty).join(', '));
