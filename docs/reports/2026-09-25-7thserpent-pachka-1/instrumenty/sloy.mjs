// Счёт слоя утилит в листах сборки — функциями замороженной сверки сессии 13 (импорт, без правки).
// node sloy.mjs <dist>  → по каждому листу: число прямых детей-правил `@layer utilities` и их прелюдии.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const S = await import(pathToFileURL('D:/SEO/cloud/site-generator/docs/reports/2026-09-25-7thserpent-tailwind-zona/instrumenty/sverka-css.mjs').href);
const dist = process.argv[2];
const dir = join(dist, '_astro');
let vsego = 0;
for (const f of readdirSync(dir).filter((x) => x.endsWith('.css')).sort()) {
  const t = readFileSync(join(dir, f), 'utf8');
  const d = S.razobrat(t);
  const { pravil: n, blokov } = S.sloyUtilit(d);
  vsego += n;
  const bloki = d.filter((b) => b.tip === 'blok' && b.prelude === '@layer utilities');
  const imena = bloki.flatMap((b) => b.deti.filter((x) => x.tip === 'blok' || x.tip === 'instr').map((c) => String(c.prelude ?? c.tekst ?? '').slice(0, 60)));
  console.log(`${f}: блоков слоя ${blokov}, правил ${n}${imena.length ? ' — ' + imena.join(' | ') : ''}`);
}
console.log(`всего: ${vsego}`);
