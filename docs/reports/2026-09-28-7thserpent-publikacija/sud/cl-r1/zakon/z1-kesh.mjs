// CL1-Z-1: «мимо кэша» не проверено — ответ из кэша Cloudflare на запрос с параметром
// (Caching Level «Ignore query string» или Cache Rule с ключом без строки запроса) называется
// отказом файла и чужим текстом, хотя Cf-Cache-Status HIT у инструмента в руках.
// Сервер здоров: на диске и у nginx — файл public/robots.txt; в кэше края — прошлая выкладка,
// отличие только в строке комментария (семантика robots та же).
import { progon, pechat, HOSTER, nashRobots } from './stend.mjs';

const proshlaya = nashRobots.replace('# A static site (Astro).', '# A static site built with Astro.');

// 1) Ignore query string: оба запроса — из кэша, Age одинаковый, тело — прошлая выкладка.
const r1 = await progon({
  robotsTelo: () => HOSTER + proshlaya,
  robotsZag: () => [['cf-cache-status', 'HIT'], ['age', '9120']],
});
pechat('Z1a кэш без строки запроса: запрос «мимо кэша» получил HIT', r1);

// 2) Контроль: тот же кэш, но параметр кэш обходит (Standard) — инструмент говорит «кэш, не отказ».
const r2 = await progon({
  robotsTelo: (u) => (u.includes('?') ? HOSTER + nashRobots : HOSTER + proshlaya),
  robotsZag: (u) => (u.includes('?') ? [['cf-cache-status', 'MISS']] : [['cf-cache-status', 'HIT'], ['age', '9120']]),
});
pechat('Z1b контроль: Standard, параметр обходит кэш', r2);

// 3) Та же природа у карты: Cache Everything (правило для статического сайта) держит прошлую карту.
const r3 = await progon({
  kartaTelo: (b) => Buffer.from(b.toString('utf8').replace('<url><loc>https://www.7thserpent.com/privacy/</loc></url>', '')),
  kartaZag: [['cf-cache-status', 'HIT'], ['age', '3100']],
});
pechat('Z1c Cache Everything: sitemap-0.xml из кэша (прошлая выкладка без /privacy/)', r3);

console.log(`\nИТОГ Z1: a=${r1.schet} [${r1.plokho.map((c) => c.imya).join('; ')}]; b=${r2.schet}; c=${r3.schet} [${r3.plokho.map((c) => c.imya).join('; ')}]`);
