// Ясность строк для владельца: (а) dist/ не собран — что говорит инструмент; (б) счёт проверок в листе владельца
// (ruki-vladelca.md, шаг 9: «43 проверки … Ждём 43/43») против инструмента; (в) имя строки о вставках в листе.
import { readFileSync } from 'node:fs';
import { server, vProcesse, progon, pechat, REPO } from './stend.mjs';

const zakr = vProcesse(server());
const r = await progon({ sborka: null });
await zakr();
pechat('Z6а dist/ не собран', r);

const list = readFileSync(`${REPO}/docs/reports/2026-09-28-7thserpent-publikacija/ruki-vladelca.md`, 'utf8');
const chislo = [...list.matchAll(/(\d+) проверк|Ждём \*\*(\d+)\/(\d+)\*\*/g)].map((m) => m[0]);
const vstavki = /«вставки Cloudflare»/.test(list);
const imena = r.proverki.map((c) => c.imya);
console.log(`лист владельца: ${chislo.join('; ')}; строка «вставки Cloudflare» в листе: ${vstavki ? 'да' : 'нет'}`);
console.log(`инструмент: проверок ${r.proverki.length}; строки со словом «вставк»: ${imena.filter((i) => /вставк/i.test(i)).join(', ') || 'нет'}; строка о HTML: «${imena.find((i) => i.startsWith('HTML страниц'))}»`);
console.log(`ИТОГ: без dist/ ${r.schet} (${r.plokho.map((c) => `${c.imya}: ${c.otkuda}`).join(' | ')}); лист ждёт ${chislo.join(', ')}, инструмент даёт ${r.proverki.length}`);
